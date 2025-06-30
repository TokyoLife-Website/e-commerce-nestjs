import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { UsersService } from '../users/users.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { ProductSku } from '../products/entities/product-sku.entity';
import { CartItem } from './entities/cart-item.entity';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { DiscountType } from 'src/common/enum/discountType.enum';
import {
  calculateDiscount,
  calculateDiscountedPrice,
} from 'src/common/utils/calculateDiscountedPrice';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { Coupon } from '../coupon/entities/coupon.entity';
import { CouponStatus } from 'src/common/enum/couponStatus.enum';
import * as dayjs from 'dayjs';
import { CouponType } from 'src/common/enum/couponType.enum';
import { validateCoupon } from 'src/common/utils/validateCoupon';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductSku)
    private productSkuRepository: Repository<ProductSku>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  private async runInTransaction(
    task: (manager: EntityManager) => Promise<void>,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await task(qr.manager);
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      if (err instanceof HttpException) throw err;
      console.error(err);
      throw new InternalServerErrorException('Something went wrong');
    } finally {
      await qr.release();
    }
  }

  async findOrCreateCart(userId: number): Promise<Cart> {
    try {
      // First try to find existing cart with minimal relations
      let cart = await this.cartRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items'],
      });

      if (!cart) {
        // If cart doesn't exist, create new one
        const user = await this.usersService.findOne(userId);
        if (!user) {
          throw new NotFoundException(`User with id ${userId} not found`);
        }

        cart = this.cartRepository.create({ user });
        cart = await this.cartRepository.save(cart);
      } else {
        // If cart exists, load full relations
        cart = await this.cartRepository.findOne({
          where: { id: cart.id },
          relations: [
            'items',
            'items.sku',
            'items.sku.product',
            'items.sku.product.skus',
            'coupon',
          ],
        });
      }

      return cart;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to find or create cart: ${error.message}`);
    }
  }

  async addItemToCart(
    userId: number,
    createCartItemDto: CreateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    const { productSkuId, quantity } = createCartItemDto;

    const productSku = await this.productSkuRepository.findOneBy({
      id: productSkuId,
    });
    if (!productSku) {
      throw new NotFoundException(`Product SKU #${productSkuId} not found`);
    }

    // Check if quantity is available
    if (productSku.quantity < quantity) {
      throw new NotFoundException(
        `Not enough quantity available. Only ${productSku.quantity} items left in stock.`,
      );
    }
    let cartItem = cart.items.find((item) => item.sku.id === productSkuId);
    if (cartItem) {
      // Check if total quantity (existing + new) doesn't exceed available stock
      const totalQuantity = cartItem.quantity + quantity;
      if (totalQuantity > productSku.quantity) {
        throw new NotFoundException(
          `Cannot add more items. Total quantity (${totalQuantity}) would exceed available stock (${productSku.quantity}).`,
        );
      }
      cartItem.quantity = totalQuantity;
      const discountedPrice = calculateDiscountedPrice(
        productSku.product.price,
        productSku.product.discountType,
        productSku.product.discountValue,
      );
      cartItem.total = totalQuantity * discountedPrice;
    } else {
      const discountedPrice = calculateDiscountedPrice(
        productSku.product.price,
        productSku.product.discountType,
        productSku.product.discountValue,
      );
      cartItem = this.cartItemRepository.create({
        sku: productSku,
        quantity,
        total: quantity * discountedPrice,
      });
      cart.items.push(cartItem);
    }
    const total = cart.items.reduce((acc, item) => acc + item.total, 0);
    cart.finalAmount = total;
    cart.total = total;
    await this.cartItemRepository.save(cartItem);
    return await this.cartRepository.save(cart);
  }

  async applyCouponToCart(userId: number, dto: ApplyCouponDto) {
    const cart = await this.findOrCreateCart(userId);

    const coupon = await this.couponRepository.findOne({
      where: { code: dto.code },
    });

    validateCoupon(coupon, cart.total);
    const discount = calculateDiscount(coupon, cart.total);

    const finalAmount = Math.max(0, cart.total - discount);

    cart.coupon = coupon;
    cart.discountAmount = discount;
    cart.finalAmount = finalAmount;
    await this.cartRepository.save(cart);
  }

  async removeCouponFromCart(userId: number): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    cart.coupon = null;
    cart.discountAmount = 0;
    const total = cart.items.reduce((sum, item) => {
      return sum + item.total;
    }, 0);
    cart.total = total;
    cart.finalAmount = total;

    await this.cartRepository.save(cart);

    return cart;
  }

  async updateItem(userId: number, dto: UpdateCartItemDto) {
    const { quantity, cartItemId, productSkuId } = dto;
    const cart = await this.findOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.id === cartItemId);
    if (!cartItem) throw new NotFoundException('Cart item not found');

    const isSkuChanged = productSkuId && productSkuId !== cartItem.sku.id;
    const updatedQuantity = quantity ?? cartItem.quantity;

    await this.runInTransaction(async (manager) => {
      if (isSkuChanged) {
        const newSku = await this.productSkuRepository.findOne({
          where: { id: productSkuId },
          relations: ['product', 'product.skus'],
        });
        if (!newSku) {
          throw new NotFoundException(`SKU #${productSkuId} not found`);
        }
        const existingItem = cart.items.find(
          (item) => item.sku.id === productSkuId && item.id !== cartItemId,
        );
        if (existingItem) {
          const totalQty = updatedQuantity + existingItem.quantity;
          if (newSku.quantity < totalQty) {
            throw new BadRequestException(`Only ${newSku.quantity} in stock`);
          }
          existingItem.quantity = totalQty;
          const discountedPrice = calculateDiscountedPrice(
            newSku.product.price,
            newSku.product.discountType,
            newSku.product.discountValue,
          );
          existingItem.total = totalQty * discountedPrice;
          await manager.save(existingItem);

          // Load cart item from database before removing
          const cartItemToRemove = await manager.findOne(CartItem, {
            where: { id: cartItemId },
          });
          if (cartItemToRemove) {
            await manager.remove(cartItemToRemove);
            // Update cart items array
            cart.items = cart.items.filter((item) => item.id !== cartItemId);
          }
        } else {
          if (newSku.quantity < updatedQuantity) {
            throw new BadRequestException(`Only ${newSku.quantity} in stock`);
          }
          cartItem.sku = newSku;
          cartItem.quantity = updatedQuantity;
          const discountedPrice = calculateDiscountedPrice(
            newSku.product.price,
            newSku.product.discountType,
            newSku.product.discountValue,
          );
          cartItem.total = updatedQuantity * discountedPrice;
          await manager.save(cartItem);
        }
      } else {
        if (cartItem.sku.quantity < updatedQuantity) {
          throw new BadRequestException(
            `Only ${cartItem.sku.quantity} in stock`,
          );
        }
        cartItem.quantity = updatedQuantity;
        const discountedPrice = calculateDiscountedPrice(
          cartItem.sku.product.price,
          cartItem.sku.product.discountType,
          cartItem.sku.product.discountValue,
        );
        cartItem.total = updatedQuantity * discountedPrice;
        await manager.save(cartItem);
      }

      const total = cart.items.reduce(
        (acc, item) =>
          acc + (item.id === cartItemId ? cartItem.total : item.total),
        0,
      );
      let discount = 0;
      if (cart.coupon) {
        try {
          validateCoupon(cart.coupon, total);
          discount = calculateDiscount(cart.coupon, total);
        } catch (error) {
          discount = 0;
          cart.coupon = null;
        }
      }
      cart.discountAmount = discount;
      cart.finalAmount = Math.max(0, total - discount);

      cart.total = total;
      await manager.save(cart);
    });

    return cart;
  }

  async removeItemFromCart(userId: number, cartItemId: number) {
    const cart = await this.findOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOneBy({
      id: cartItemId,
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }
    await this.cartItemRepository.remove(cartItem);
    cart.items = cart.items.filter((item) => item.id !== cartItemId);
    const total = cart.items.reduce((acc, item) => acc + item.total, 0);
    cart.total = total;

    if (cart.coupon) {
      const { minOrderAmout } = cart.coupon;
      if (minOrderAmout && minOrderAmout > total) {
        cart.coupon = null;
        cart.discountAmount = 0;
        cart.finalAmount = total;
      } else {
        const discount = calculateDiscount(cart.coupon, total);
        cart.discountAmount = discount;
        cart.finalAmount = Math.max(0, total - discount);
      }
    } else {
      cart.finalAmount = total;
    }
    return await this.cartRepository.save(cart);
  }

  async clearCart(userId: number) {
    const cart = await this.findOrCreateCart(userId);
    await this.cartItemRepository.remove(cart.items);
    cart.items = [];
    cart.total = 0;
    cart.coupon = null;
    cart.discountAmount = 0;
    cart.finalAmount = 0;
    await this.cartRepository.save(cart);
  }
}
