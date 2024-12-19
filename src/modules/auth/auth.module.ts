import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from './jwt.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';
import { RedisConfigModule } from '../redis/redis.module';
import { BullConfigModule } from '../bullMQ/bullMQ.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule,
    JwtConfigModule,
    UsersModule,
    RedisConfigModule,
    BullConfigModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtRefreshStrategy],
})
export class AuthModule {}
