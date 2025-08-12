import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { ProductSku } from '../products/entities/product-sku.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { PerspectiveModule } from '../perspective/perspective.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ProductSku, OrderItem, User]),
    UsersModule,
    ProductsModule,
    PerspectiveModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
