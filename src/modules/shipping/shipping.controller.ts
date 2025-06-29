import { Body, Controller, Get, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateShippingFeeDto } from './dto/calculate-shipping-fee';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('fee')
  async getShippingFee(@Query() dto: CalculateShippingFeeDto) {
    return this.shippingService.calculateShippingFee(dto);
  }
}
