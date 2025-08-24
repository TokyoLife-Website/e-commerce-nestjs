import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateReviewStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
