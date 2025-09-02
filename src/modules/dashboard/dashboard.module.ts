import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { ProductSku } from '../products/entities/product-sku.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Coupon } from '../coupon/entities/coupon.entity';
import { Review } from '../review/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      User,
      ProductSku,
      OrderItem,
      Coupon,
      Review,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
