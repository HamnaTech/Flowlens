import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ReqMeta } from '../../common/decorators/req-meta.decorator';
import { RequestMeta } from './auth.service';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { CurrentRefreshToken, RefreshTokenRequestUser } from '../../common/decorators/current-refresh-token.decorator';
import { IsString } from 'class-validator';

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  newPassword: string;
}

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---- Current user -------------------------------------------

  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.id);
  }

  // ---- Registration & login -------------------------------------------

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 registrations/min/IP — bot signup mitigation
  @Post('register')
  register(@Body() dto: RegisterDto, @ReqMeta() meta: RequestMeta) {
    return this.authService.register(dto, meta);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // IP-level throttle; account-level lockout is separate (see AuthService)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto, @ReqMeta() meta: RequestMeta) {
    return this.authService.login(dto, meta);
  }

  // ---- Token refresh & logout -------------------------------------------

  @Public()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@CurrentRefreshToken() tokenUser: RefreshTokenRequestUser, @ReqMeta() meta: RequestMeta) {
    return this.authService.refreshTokens(tokenUser.sub, tokenUser.jti, meta);
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@CurrentRefreshToken() tokenUser: RefreshTokenRequestUser) {
    await this.authService.logout(tokenUser.sub, tokenUser.jti);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.revokeAllSessions(user.id);
  }

  // ---- Session management -------------------------------------------

  @Get('sessions')
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('sessions/:id/revoke')
  async revokeSession(@CurrentUser() user: AuthenticatedUser, @Param('id') sessionId: string) {
    await this.authService.revokeSession(user.id, sessionId);
  }

  // ---- Email verification -------------------------------------------

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully.' };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('resend-verification')
  async resendVerification(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.resendVerificationEmail(user.id);
  }

  // ---- Forgot / reset password -------------------------------------------

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @ReqMeta() meta: RequestMeta) {
    await this.authService.forgotPassword(dto, meta);
    // Constant response regardless of whether the email existed.
    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully. Please log in again.' };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
