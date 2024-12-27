import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProductSkuDto } from './create-product-sku.entity';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsDecimal()
  @IsOptional()
  discountPrice?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ProductSkuDto)
  skus: ProductSkuDto[];
}
