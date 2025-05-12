import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { UsersService } from '../users/users.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { ProductSku } from '../products/entities/product-sku.entity';
import { CartItem } from './entities/cart-item.entity';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductSku)
    private productSkuRepository: Repository<ProductSku>,
    private usersService: UsersService,
  ) {}

  async findOrCreateCart(userId: number) {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.sku'],
    });
    if (!cart) {
      const user = await this.usersService.findOne(userId);
      cart = this.cartRepository.create({ user });
      cart = await this.cartRepository.save(cart);
    }
    return cart;
  }

  async addItemToCart(
    userId: number,
    createCartItemDto: CreateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    const { productSkuId, quantity } = createCartItemDto;
    
    // Check if product SKU exists
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
      cartItem.total = totalQuantity * productSku.product.price;
    } else {
      cartItem = this.cartItemRepository.create({
        sku: productSku,
        quantity,
        total: quantity * productSku.product.price,
      });
      cart.items.push(cartItem);
    }
    cart.total = cart.items.reduce((acc, item) => acc + item.total, 0);
    await this.cartItemRepository.save(cartItem);
    return await this.cartRepository.save(cart);
  }

  async updateItem(userId: number, updateCartItemDto: UpdateCartItemDto) {
    const { productSkuId, quantity, cartItemId } = updateCartItemDto;
    const cart = await this.findOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.id === cartItemId);
    if (!cartItem) throw new NotFoundException('Cart item not found');
    const productSku = await this.productSkuRepository.findOneBy({
      id: productSkuId,
    });
    if (!productSku)
      throw new NotFoundException(`Product SKU ${productSku} not found`);
    cartItem.quantity = quantity;
    cartItem.sku = productSku;
    await this.cartItemRepository.save(cartItem);
    return this.cartRepository.save(cart);
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
    cart.total = cart.items
      .filter((item) => item.id !== cartItemId)
      .reduce((acc, item) => acc + item.total, 0);
    return await this.cartRepository.save(cart);
  }

  async clearCart(userId: number) {
    const cart = await this.findOrCreateCart(userId);
    await this.cartItemRepository.remove(cart.items);
    cart.items = [];
    cart.total = 0;
    await this.cartRepository.save(cart);
  }
}
