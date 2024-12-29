import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishList } from './entities/wishlist.entity';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([WishList]), UsersModule, ProductsModule],
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}
