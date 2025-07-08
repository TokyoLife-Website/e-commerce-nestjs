import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { CreatePaymentUrlDto } from './dto/create-payment-url.dto';
import { VNPayCallbackDto } from './dto/vnpay-callback.dto';
import { VNPayService } from './vnpay.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from 'src/common/enum/orderStatus.enum';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly vnpayService: VNPayService,
    private readonly orderService: OrdersService,
  ) {}

  @Post('vnpay/create')
  async createPayment(
    @Body() createPaymentURL: CreatePaymentUrlDto,
    @Req() req: Request,
  ) {
    const ipAddr = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const paymentData: CreatePaymentUrlDto = {
      ...createPaymentURL,
      ipAddr,
    };

    const paymentUrl = this.vnpayService.createPaymentUrl(paymentData);

    return {
      paymentUrl,
    };
  }

  @Public()
  @Get('vnpay/callback')
  async vnpayCallback(@Query() query: VNPayCallbackDto, @Res() res: Response) {
    const orderId = query.vnp_TxnRef;
    const result = this.vnpayService.vnpayCallback(query);

    if (result.isValid && result.responseCode === '00') {
      await this.orderService.updateStatus(
        result.data.orderId,
        OrderStatus.PROCESSING,
      );

      // Redirect về trang thành công
      return res.redirect(
        `${process.env.CLIENT_BASE_URL}/order-complete?code=${orderId}`,
      );
    } else {
      // Giao dịch thất bại
      await this.orderService.updateStatus(orderId, OrderStatus.CANCELLED);

      // Redirect về trang thất bại
      return res.redirect(
        `${process.env.CLIENT_BASE_URL}/payment-failed?code=${orderId}`,
      );
    }
  }
}
