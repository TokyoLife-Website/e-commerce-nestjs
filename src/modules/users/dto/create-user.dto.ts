import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return new Date(value); // Nếu là string, convert sang Date
    return value; // Nếu là Date object, giữ nguyên
  })
  @IsDate({ message: 'dob must be a valid date format (YYYY-MM-DD).' })
  dob: Date;
}
