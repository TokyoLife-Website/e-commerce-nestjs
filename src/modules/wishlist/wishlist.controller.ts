import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserParams } from 'src/common/decorators/user.decorator';
import { WishlistService } from './wishlist.service';
import { User } from '../users/entities/user.entity';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}
  @Get()
  async getWishlistByUser(@UserParams() user: User) {
    return await this.wishlistService.getWishlistByUser(user.id);
  }

  @Post(':productId')
  async addToWishlist(
    @UserParams() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return await this.wishlistService.addToWishlist(user.id, productId);
  }

  @Delete(':id')
  @ResponseMessage('Remove wishlist item successfully')
  async removeFromWishlist(@Param('id', ParseIntPipe) id: number) {
    return await this.wishlistService.removeFromWishlist(id);
  }

  @Delete()
  @ResponseMessage('Clear wishlist successfully')
  async clearWishlist(@UserParams() user: User) {
    return await this.wishlistService.clearWishlist(user.id);
  }
}
