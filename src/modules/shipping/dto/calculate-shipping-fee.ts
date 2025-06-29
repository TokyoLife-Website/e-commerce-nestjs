import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CalculateShippingFeeDto {
  @IsNotEmpty()
  @IsString()
  pick_province: string;

  @IsNotEmpty()
  @IsString()
  pick_district: string;

  @IsOptional()
  @IsString()
  pick_ward?: string;

  @IsOptional()
  @IsString()
  pick_address?: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  weight: number;
}
