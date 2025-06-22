import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderStatus } from 'src/common/enum/orderStatus.enum';
import { ProductsService } from '../products/products.service';
import { AddressesService } from '../addresses/addresses.service';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { ProductSku } from '../products/entities/product-sku.entity';
import { UsersService } from '../users/users.service';
import { calculateDiscountedPrice } from 'src/common/utils/calculateDiscountedPrice';
import { CartService } from '../cart/cart.service';
import { EmailService } from '../email/email.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { queueName } from 'src/common/constants/queueName';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly addressesService: AddressesService,
    private readonly cartService: CartService,
    private readonly emailService: EmailService,
    @InjectQueue(queueName.MAIL) private readonly mailQueue: Queue,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  private isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
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
        status: OrderStatus.PENDING,
        total: 0,
        shippingFee: 0,
        discount: 0,
        items: [],
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Process order items
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
        const discountedPrice = calculateDiscountedPrice(
          sku.product.price,
          sku.product.discountType,
          sku.product.discountValue,
        );
        const itemTotal = discountedPrice * item.quantity;
        orderTotal += itemTotal;

        // Create order item
        const orderItem = this.orderItemRepository.create({
          order: savedOrder,
          sku,
          quantity: item.quantity,
          price: discountedPrice,
          total: itemTotal,
        });

        orderItems.push(orderItem);

        // Update SKU quantity
        sku.quantity -= item.quantity;
        await queryRunner.manager.save(sku);
      }

      // Save order items
      await queryRunner.manager.save(orderItems);

      // Update order total
      savedOrder.total = orderTotal;
      savedOrder.items = orderItems;
      await queryRunner.manager.save(savedOrder);
      await this.cartService.clearCart(user.id);
      await queryRunner.commitTransaction();
      await this.mailQueue.add('sendOrderConfirmationEmail', {
        user,
        order: savedOrder,
      });
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

  async findOne(code: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { code },
      relations: [
        'user',
        'address',
        'address.province',
        'address.district',
        'address.ward',
        'items.sku.product',
      ],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${code} not found`);
    }
    return order;
  }

  async remove(code: string): Promise<void> {
    const order = await this.findOne(code);
    await this.orderRepository.remove(order);
  }

  async updateStatus(code: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findOne(code);

    if (!this.isValidStatusTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`,
      );
    }

    order.status = newStatus;
    return this.orderRepository.save(order);
  }
}
