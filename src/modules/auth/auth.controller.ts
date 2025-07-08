import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { JwtRefreshAuthGuard } from 'src/common/guards/jwt-refresh-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { DecodedTokenDto } from './dto/decoded-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';

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

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  async logout(@Req() req: Request) {
    const { attributes, refreshTokenExpiresAt } = req.user as DecodedTokenDto;
    await this.authService.logout(
      attributes.id,
      req.body.refreshToken,
      refreshTokenExpiresAt,
    );
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

  @Post('verify-otp')
  @ResponseMessage('OTP verified successfully!')
  async verifyOtp(@Body() dto: VerifyOTPDto) {
    await this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @ResponseMessage('Password has been successfully reset.')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
