import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  skuId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
