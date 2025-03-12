import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductSkuDto } from './create-product-sku.entity';
import { Type } from 'class-transformer';
import { DiscountType } from 'src/common/enum/discountType.enum';

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

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsDecimal()
  @IsOptional()
  @Min(0)
  discountValue?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsArray()
  @ValidateNested({ each: true, message: '' })
  @ArrayMinSize(1)
  @Type(() => ProductSkuDto)
  skus: ProductSkuDto[];
}
