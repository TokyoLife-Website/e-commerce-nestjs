import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AddressType } from 'src/common/enum/addressType.enum';

export class CreateAddressDto {
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @IsBoolean()
  @IsOptional()
  isDefault: boolean;

  @IsInt()
  @IsNotEmpty()
  provinceId: number;

  @IsInt()
  @IsNotEmpty()
  districtId: number;

  @IsInt()
  @IsNotEmpty()
  wardId: number;

  @IsString()
  @IsNotEmpty()
  detail: string;
}
