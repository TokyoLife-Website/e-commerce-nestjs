import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
import { COOKIE_NAME } from 'src/common/constants/cookieName';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ResponseMessage('Login successfully!')
  async login(
    @Body() loginBody: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const user: User = await this.authService.validateUser(
      loginBody.email,
      loginBody.password,
    );
    const tokens = await this.authService.generateTokenPair(user);

    res.cookie(
      COOKIE_NAME.ACCESS_TOKEN,
      tokens.access_token,
      this.authService.getCookieOptions(tokens.access_token),
    );

    res.cookie(
      COOKIE_NAME.REFRESH_TOKEN,
      tokens.refresh_token,
      this.authService.getCookieOptions(tokens.refresh_token),
    );

    return user;
  }

  @Post('register')
  @ResponseMessage('Register successfully!')
  async register(@Body() registerBody: CreateUserDto): Promise<any> {
    return this.authService.register(registerBody);
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const { attributes, refreshTokenExpiresAt } = req.user as DecodedTokenDto;
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(
        attributes.id,
        refreshToken,
        refreshTokenExpiresAt,
      );
    }

    res.clearCookie(
      COOKIE_NAME.ACCESS_TOKEN,
      this.authService.getCookieOptions(),
    );
    res.clearCookie(
      COOKIE_NAME.REFRESH_TOKEN,
      this.authService.getCookieOptions(),
    );

    return { message: 'Logout successfully!' };
  }

  @Post('refresh-token')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    if (!req.user) {
      throw new InternalServerErrorException();
    }

    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new InternalServerErrorException('Refresh token not found');
    }

    const tokens = await this.authService.generateTokenPair(
      (req.user as any).attributes,
      refreshToken,
      (req.user as any).refreshTokenExpiresAt,
    );

    res.cookie(
      COOKIE_NAME.ACCESS_TOKEN,
      tokens.access_token,
      this.authService.getCookieOptions(tokens.access_token),
    );

    res.cookie(
      COOKIE_NAME.REFRESH_TOKEN,
      tokens.refresh_token,
      this.authService.getCookieOptions(tokens.refresh_token),
    );

    return { message: 'Token refreshed successfully!' };
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
