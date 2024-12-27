import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProductSkuDto {
  @IsString({ message: 'Color is required and must be a string.' })
  @IsNotEmpty({ message: 'Color cannot be empty.' })
  color: string;

  @IsString({ message: 'Size is required and must be a string.' })
  @IsNotEmpty({ message: 'Size cannot be empty.' })
  size: string;

  @IsInt({ message: 'Quantity must be an integer.' })
  @IsNotEmpty({ message: 'Quantity cannot be empty.' })
  quantity: number;
}
