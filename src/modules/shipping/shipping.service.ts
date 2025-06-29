import { HttpException, Injectable } from '@nestjs/common';
import { CalculateShippingFeeDto } from './dto/calculate-shipping-fee';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShippingService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly GHTK_API =
    'https://services.giaohangtietkiem.vn/services/shipment/fee';

  async calculateShippingFee(dto: CalculateShippingFeeDto) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Token: this.configService.get<string>('GHTK_TOKEN'),
      };

      const response = await firstValueFrom(
        this.httpService.get(this.GHTK_API, {
          headers,
          params: { ...dto, deliver_option: 'none' },
        }),
      );
      const result = response.data;
      if (!result.success || !result.fee) {
        throw new Error(result.message || 'Failed to get fee');
      }
      return { shippingFee: result.fee.fee };
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'GHTK fee calculation failed',
        error.response?.status || 500,
      );
    }
  }
}
