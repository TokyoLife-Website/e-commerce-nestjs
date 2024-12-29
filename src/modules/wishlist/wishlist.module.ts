import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}
