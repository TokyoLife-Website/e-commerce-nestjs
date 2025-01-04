import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateCartItemDto {
  @IsInt()
  @IsNotEmpty()
  productSkuId: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
