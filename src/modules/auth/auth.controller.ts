import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/entities/user.entity';
import { JwtRefreshAuthGuard } from 'src/common/guards/jwt-refresh-auth.guard';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ResponseMessage('Login successfully!')
  async login(@Body() loginBody: LoginDto): Promise<LoginResponseDto> {
    const user: User = await this.authService.validateUser(
      loginBody.email,
      loginBody.password,
    );
    return this.authService.generateTokenPair(user);
  }

  @Post('register')
  @ResponseMessage('Register successfully!')
  async register(@Body() registerBody: CreateUserDto): Promise<any> {
    return this.authService.register(registerBody);
  }

  @Post('refresh-token')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(@Req() req: Request) {
    if (!req.user) {
      throw new InternalServerErrorException();
    }
    return this.authService.generateTokenPair(
      (req.user as any).attributes,
      req.body.refreshToken,
      (req.user as any).refreshTokenExpiresAt,
    );
  }

  @Post('forgot-password')
  @ResponseMessage('reset password link was sent successfully!')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ResponseMessage('Password has been successfully reset.')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
