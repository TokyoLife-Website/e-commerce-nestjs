import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class DecodedTokenDto {
  @IsNotEmpty()
  attributes: Omit<User, 'password'>;

  @Type(() => Date)
  @IsNotEmpty()
  refreshTokenExpiresAt: Date;
}
