import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { VNPayService } from './vnpay.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentController],
  providers: [VNPayService],
  exports: [VNPayService],
})
export class PaymentModule {}
