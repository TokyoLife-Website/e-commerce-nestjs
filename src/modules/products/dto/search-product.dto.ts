import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SortType } from 'src/common/enum/sortType.enum';

export class SearchProductsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  // category slug to filter products by category (including descendants)
  category?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes('_')) {
      const [min, max] = value.split('_').map(Number);
      return { min, max };
    }
    return null;
  })
  price?: { min: number; max: number };

  @IsOptional()
  @IsEnum(SortType)
  sort?: SortType;
}
