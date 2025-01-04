import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { User } from '../users/entities/user.entity';
import { UserParams } from 'src/common/decorators/user.decorator';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { use } from 'passport';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Get()
  async getCart(@UserParams() user: User) {
    return await this.cartService.findOrCreateCart(user.id);
  }

  @Post()
  async addItemToCart(
    @UserParams() user: User,
    @Body() createCartItemDto: CreateCartItemDto,
  ) {
    return await this.cartService.addItemToCart(user.id, createCartItemDto);
  }

  @Patch()
  async updateItem(
    @UserParams() user: User,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return await this.cartService.updateItem(user.id, updateCartItemDto);
  }

  @Delete(':id')
  async removeCartItem(
    @Param('id', ParseIntPipe) cartItemId: number,
    @UserParams() user: User,
  ) {
    return await this.cartService.removeItemFromCart(user.id, cartItemId);
  }

  @Delete()
  async clearCart(@UserParams() user: User) {
    return await this.cartService.clearCart(user.id);
  }
}
