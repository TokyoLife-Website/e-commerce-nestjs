import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/common/enum/gender.enum';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsString()
  @IsOptional()
  avatar: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  @IsOptional()
  gender: Gender;
}
