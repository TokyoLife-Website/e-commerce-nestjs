import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderStatus } from 'src/common/enum/orderStatus.enum';
import { Role } from 'src/common/enum/role.enum';
import { AddressesService } from '../addresses/addresses.service';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { ProductSku } from '../products/entities/product-sku.entity';
import { UsersService } from '../users/users.service';
import { calculateDiscount } from 'src/common/utils/calculateDiscountedPrice';
import { CartService } from '../cart/cart.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { queueName } from 'src/common/constants/queueName';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';
import { Coupon } from '../coupon/entities/coupon.entity';
import { ShippingService } from '../shipping/shipping.service';
import { validateCoupon } from 'src/common/utils/validateCoupon';
import { PaymentMethod } from 'src/common/enum/paymentMethode.enum';
import { NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly addressesService: AddressesService,
    private readonly cartService: CartService,
    private readonly shippingService: ShippingService,
    @InjectQueue(queueName.MAIL) private readonly mailQueue: Queue,
    private readonly notificationService: NotificationService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  private async notifyAdminNewOrder(order: Order): Promise<void> {
    try {
      // Tìm tất cả admin users
      const adminUsers = await this.userRepository.find({
        where: { role: Role.Admin },
      });

      // Tạo notification cho từng admin
      for (const admin of adminUsers) {
        await this.notificationService.sendNotificationToUser(
          admin.id.toString(),
          {
            userId: admin.id.toString(),
            title: 'Đơn hàng mới',
            message: `Có đơn hàng mới #${order.code} từ ${order.user.firstName} ${order.user.lastName} với tổng tiền ${order.finalAmount.toLocaleString('vi-VN')}đ`,
            type: NotificationType.INFO,
            data: {
              orderId: order.id,
              orderCode: order.code,
              customerName: `${order.user.firstName} ${order.user.lastName}`,
              amount: order.finalAmount,
              status: order.status,
              createdAt: order.createdAt,
            },
          },
        );
      }
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      // Không throw error để không ảnh hưởng đến việc tạo order
    }
  }

  private isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const { addressId, paymentMethod, note } = createOrderDto;
    // Validate user exists
    const user = await this.usersService.findOne(userId);
    const cart = await this.cartService.findOrCreateCart(user.id);

    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');
    // Validate address exists and belongs to user
    const address = await this.addressesService.findOne(addressId, userId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order
      const orderNumber = this.generateOrderNumber();
      const order = this.orderRepository.create({
        code: orderNumber,
        user,
        address,
        paymentMethod,
        note,
        status:
          paymentMethod === PaymentMethod.VN_PAY
            ? OrderStatus.PENDING
            : OrderStatus.PROCESSING,
        total: 0,
        shippingFee: 0,
        discount: 0,
        items: [],
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Process order items
      let quantity = 0;
      let orderTotal = 0;
      const orderItems: OrderItem[] = [];

      for (const item of cart.items) {
        const sku = await queryRunner.manager.findOne(ProductSku, {
          where: { id: item.sku.id },
          relations: ['product'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!sku || sku.quantity < item.quantity) {
          throw new BadRequestException(
            `Product ${sku?.product?.name || ''} is out of stock`,
          );
        }
        const itemTotal = sku.product.finalPrice * item.quantity;
        orderTotal += itemTotal;

        // Create order item
        const orderItem = this.orderItemRepository.create({
          order: savedOrder,
          sku,
          quantity: item.quantity,
          price: sku.product.finalPrice,
          total: itemTotal,
        });

        orderItems.push(orderItem);

        // Update SKU quantity
        quantity += item.quantity;
        sku.quantity -= item.quantity;
        sku.product.soldCount += item.quantity;
        sku.product.stock -= item.quantity;
        await queryRunner.manager.save(sku.product);
        await queryRunner.manager.save(sku);
      }

      // Save order items
      await queryRunner.manager.save(orderItems);

      const isFreeShip = orderTotal >= 300000;
      let coupon = null;
      let discount = 0;
      let finalAmount = 0;
      let shippingFee = 0;
      if (!isFreeShip) {
        const shippingResult = await this.shippingService.calculateShippingFee({
          pick_province: 'Hà Nội',
          pick_district: 'Cầu Giấy',
          province: address.province.name,
          district: address.district.name,
          ward: address.ward.name,
          address: address.detail,
          weight: quantity * 300,
        });
        shippingFee = shippingResult.shippingFee;
      }

      if (cart.coupon) {
        coupon = await this.couponRepository.findOneByOrFail({
          code: cart.coupon.code,
        });
        try {
          validateCoupon(coupon, orderTotal);
          discount = calculateDiscount(coupon, orderTotal);
          coupon.usedCount += 1;
          await queryRunner.manager.save(coupon);
        } catch (error) {
          coupon = null;
          discount = 0;
        }
      }

      finalAmount = Math.max(0, orderTotal + shippingFee - discount);

      // Update order total
      savedOrder.coupon = coupon;
      savedOrder.discount = discount;
      savedOrder.total = orderTotal;
      savedOrder.shippingFee = shippingFee;
      savedOrder.finalAmount = finalAmount;
      savedOrder.items = orderItems;
      const statusHistory = [
        queryRunner.manager.create('OrderStatusHistory', {
          orderId: savedOrder.id,
          status: OrderStatus.PENDING,
        }),
      ];
      if (paymentMethod === PaymentMethod.COD) {
        statusHistory.push(
          queryRunner.manager.create('OrderStatusHistory', {
            orderId: savedOrder.id,
            status: savedOrder.status,
          }),
        );
      }
      await queryRunner.manager.save(statusHistory);
      await queryRunner.manager.save(savedOrder);
      await this.cartService.clearCart(user.id);
      await queryRunner.commitTransaction();
      await this.mailQueue.add('sendOrderConfirmationEmail', {
        user,
        order: savedOrder,
      });

      // Gửi notification cho admin
      await this.notifyAdminNewOrder(savedOrder);

      return savedOrder;
    } catch (error) {
      console.error('Failed to create order', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    userId: number,
    filters: { status: OrderStatus },
    { limit, offset, page, size }: Pagination,
  ): Promise<PaginationResource<Partial<Order>>> {
    const user = await this.usersService.findOne(userId);
    const where: any = {
      userId: user.id,
    };
    if (filters.status) {
      where.status = filters.status;
    }
    const [orders, total] = await this.orderRepository.findAndCount({
      order: {
        createdAt: 'DESC',
      },
      where,
      take: limit,
      skip: offset,
    });
    return {
      items: orders,
      page,
      size,
      totalItems: total,
      totalPages: Math.ceil(total / size),
    };
  }

  async findAllForAdmin(
    filters: { status: OrderStatus; userId: number },
    { limit, offset, page, size }: Pagination,
  ): Promise<PaginationResource<Partial<Order>>> {
    const where: any = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      relations: ['user', 'address', 'items.sku.product', 'user.avatar'],
      order: {
        createdAt: 'DESC',
      },
      where,
      take: limit,
      skip: offset,
    });

    return {
      items: orders,
      page,
      size,
      totalItems: total,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(code: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { code },
      relations: [
        'user',
        'user.avatar',
        'address',
        'address.province',
        'address.district',
        'address.ward',
        'items.sku.product',
        'orderStatusHistory',
      ],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${code} not found`);
    }

    // Sort orderStatusHistory by createdAt if it exists
    if (order.orderStatusHistory) {
      order.orderStatusHistory.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return order;
  }

  async remove(code: string): Promise<void> {
    const order = await this.findOne(code);
    await this.orderRepository.remove(order);
  }

  async updateStatus(code: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { code },
      relations: ['coupon', 'items', 'items.sku', 'items.sku.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${code} not found`);
    }

    if (!this.isValidStatusTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${JSON.stringify(newStatus)}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (
        order.status !== OrderStatus.CANCELLED &&
        newStatus === OrderStatus.CANCELLED &&
        order.coupon
      ) {
        order.coupon.usedCount = Math.max(0, order.coupon.usedCount - 1);
        await queryRunner.manager.save(order.coupon);
      }
      if (
        newStatus === OrderStatus.RETURNED ||
        newStatus === OrderStatus.CANCELLED
      ) {
        // When order is returned, restore stock and reduce soldCount
        for (const item of order.items) {
          const sku = await queryRunner.manager.findOne(ProductSku, {
            where: { id: item.sku.id },
            relations: ['product'],
            lock: { mode: 'pessimistic_write' },
          });

          if (sku) {
            // Restore SKU quantity
            sku.quantity += item.quantity;
            // Reduce product soldCount and restore stock
            sku.product.soldCount = Math.max(
              0,
              sku.product.soldCount - item.quantity,
            );
            sku.product.stock += item.quantity;
            await queryRunner.manager.save(sku.product);
            await queryRunner.manager.save(sku);
          }
        }
      }

      order.status = newStatus;
      const updatedOrder = await queryRunner.manager.save(order);

      // Create status history record
      const statusHistory = queryRunner.manager.create('OrderStatusHistory', {
        orderId: order.id,
        status: newStatus,
      });
      await queryRunner.manager.save(statusHistory);

      await queryRunner.commitTransaction();
      return updatedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
