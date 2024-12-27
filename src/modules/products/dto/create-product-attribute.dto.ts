import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProductAtributeType } from 'src/common/enum/productAtributeType.enum';

export class CreateProductAttributeDto {
  @IsNotEmpty()
  @IsEnum(ProductAtributeType)
  type: ProductAtributeType;

  @IsString()
  @IsNotEmpty()
  value: string;
}
