import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
// import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomBytes } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { queueName } from 'src/common/constants/queueName';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    @InjectQueue(queueName.MAIL) private readonly mailQueue: Queue,
  ) {}
  async register(user: CreateUserDto): Promise<User> {
    return await this.usersService.create(user);
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  async forgotPassword(emailDto: ForgotPasswordDto): Promise<void> {
    const { email } = emailDto;
    const user: User = await this.usersService.findOneByEmail(email);
    if (!user) throw new NotFoundException(`No user found for email: ${email}`);
    const tokenExpires = this.configService.get<number>(
      'RESET_PASSWORD_TOKEN_EXPIRES',
    );
    await this.redisService.rateLimiter(user.id, 5, 60);
    const token = randomBytes(16).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + tokenExpires * 60 * 1000); //5 minutes
    await this.usersService.save(user);
    const message = {
      user,
      token,
    };
    await this.mailQueue.add('sendForgotPasswordEmail', message);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { newPassword, token } = resetPasswordDto;
    const user: User = await this.usersService.findOneByResetToken(token);
    if (!user || user.resetTokenExpires < new Date())
      throw new NotFoundException('Token not found or expired');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await this.usersService.save(user);
  }
}
