import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { User } from '../users/entities/user.entity';
import { AddressesModule } from '../addresses/addresses.module';
import { UsersModule } from '../users/users.module';
import { CartModule } from '../cart/cart.module';
import { EmailModule } from '../email/email.module';
import { BullConfigModule } from '../bullMQ/bullMQ.module';
import { Coupon } from '../coupon/entities/coupon.entity';
import { ShippingModule } from '../shipping/shipping.module';
import { NotificationModule } from '../notification';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderStatusHistory,
      User,
      Coupon,
    ]),
    UsersModule,
    AddressesModule,
    CartModule,
    EmailModule,
    BullConfigModule,
    ShippingModule,
    NotificationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
