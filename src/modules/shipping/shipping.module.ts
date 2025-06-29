import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}
