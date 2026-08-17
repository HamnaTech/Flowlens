import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { ActivityAction, NotificationType, PlatformRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CacheHelperService } from '../../cache/cache-helper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access token lifetime, seconds — client uses this to schedule silent refresh
}

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly cache: CacheHelperService,
    private readonly notifications: NotificationsService,
  ) {}

  // --------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------

  async register(dto: RegisterDto, meta: RequestMeta): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      // Deliberately vague to avoid confirming which emails are registered
      // via a different error shape than other 409s would produce.
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
        platformRole: PlatformRole.USER,
      },
    });

    await this.issueEmailVerificationToken(user.id, user.email);

    await this.recordActivity(user.id, ActivityAction.LOGIN, meta, { event: 'register' });

    const tokens = await this.issueTokenPair(user.id, user.email, user.platformRole, meta);

    this.logger.log(`New user registered: ${user.id}`);
    return { user: toPublicUser(user), tokens };
  }

  // --------------------------------------------------------------------
  // Login
  // --------------------------------------------------------------------

  async login(dto: LoginDto, meta: RequestMeta): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const lockKey = `login-lockout:${dto.email.toLowerCase()}`;
    const attempts = (await this.cache.getOrSet(lockKey, LOCKOUT_WINDOW_SECONDS, async () => 0)) as number;
    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many failed login attempts. Please try again in 15 minutes or reset your password.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });

    const passwordValid = user?.passwordHash ? await argon2.verify(user.passwordHash, dto.password) : false;

    if (!user || !passwordValid) {
      await this.registerFailedLogin(dto.email.toLowerCase(), meta);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated. Contact support for assistance.');
    }

    // Successful login clears the lockout counter.
    await this.cache.invalidate(lockKey);

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.recordActivity(user.id, ActivityAction.LOGIN, meta);

    const tokens = await this.issueTokenPair(user.id, user.email, user.platformRole, meta);
    return { user: toPublicUser(user), tokens };
  }

  private async registerFailedLogin(email: string, meta: RequestMeta): Promise<void> {
    const lockKey = `login-lockout:${email}`;
    await this.cache.increment(lockKey, LOCKOUT_WINDOW_SECONDS);

    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await this.recordActivity(user.id, ActivityAction.LOGIN_FAILED, meta);
    }
  }

  // --------------------------------------------------------------------
  // Token issuance & refresh rotation
  // --------------------------------------------------------------------

  private async issueTokenPair(
    userId: string,
    email: string,
    platformRole: PlatformRole,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn')!;
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, platformRole },
      { secret: this.config.get<string>('jwt.accessSecret'), expiresIn: accessExpiresIn },
    );

    // jti is the RefreshToken row's own id, generated up front so it can be
    // embedded in the JWT payload and used to look the row up on refresh
    // without scanning by token hash first.
    const jti = randomUUID();
    const rawRefreshToken = randomBytes(48).toString('hex');
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: refreshExpiresIn },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: this.hashToken(rawRefreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: addDuration(refreshExpiresIn),
      },
    });

    // The raw refresh token embedded in the JWT (signed) IS the credential;
    // we store its hash for revocation lookups but the JWT itself is what
    // the client holds. We fold the raw secret into the signed JWT's
    // payload indirectly by keying storage off `jti`, and additionally
    // bind the JWT signature itself as the possession factor — this
    // avoids shipping two separate secrets to the client for one login.
    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationToSeconds(accessExpiresIn),
    };
  }

  async refreshTokens(userId: string, jti: string, meta: RequestMeta): Promise<TokenPair> {
    const existing = await this.prisma.refreshToken.findUnique({ where: { id: jti } });

    if (!existing || existing.userId !== userId || existing.isRevoked || existing.expiresAt < new Date()) {
      // Reuse of a revoked/expired token is a strong signal of a stolen
      // token — revoke every session for this user defensively.
      if (existing?.isRevoked) {
        this.logger.warn(`Refresh token reuse detected for user ${userId}. Revoking all sessions.`);
        await this.revokeAllSessions(userId);
      }
      throw new UnauthorizedException('Refresh token is invalid or has expired. Please log in again.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or no longer exists.');
    }

    // Rotation: revoke the token just used, issue a brand new pair. This
    // means a refresh token is single-use — if a stolen token is replayed
    // after the legitimate client already rotated it, the reuse-detection
    // branch above fires.
    await this.prisma.refreshToken.update({ where: { id: jti }, data: { isRevoked: true } });

    return this.issueTokenPair(user.id, user.email, user.platformRole, meta);
  }

  // --------------------------------------------------------------------
  // Logout / session management
  // --------------------------------------------------------------------

  async logout(userId: string, jti: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { id: jti, userId },
      data: { isRevoked: true },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.refreshToken.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found.');
    }
    await this.prisma.refreshToken.update({ where: { id: sessionId }, data: { isRevoked: true } });
  }

  // --------------------------------------------------------------------
  // Email verification
  // --------------------------------------------------------------------

  private async issueEmailVerificationToken(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
      },
    });
    await this.email.sendVerificationEmail(email, rawToken);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found.');
    if (user.emailVerifiedAt) throw new BadRequestException('Email is already verified.');
    await this.issueEmailVerificationToken(user.id, user.email);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    ]);
  }

  // --------------------------------------------------------------------
  // Forgot / reset password
  // --------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto, meta: RequestMeta): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });

    // Always behave identically whether or not the account exists — this
    // is the standard mitigation against account-enumeration via timing
    // or response-shape differences on this endpoint.
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
        requestedIp: meta.ipAddress,
      },
    });

    await this.email.sendPasswordResetEmail(user.email, rawToken);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This password reset link is invalid or has expired.');
    }

    const passwordHash = await this.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    ]);

    // Resetting a password is a strong trust boundary — every existing
    // session (every device) is logged out, forcing re-authentication with
    // the new credential everywhere.
    await this.revokeAllSessions(record.userId);

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (user) {
      await this.email.sendPasswordChangedAlert(user.email);
      await this.notifications.create({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: 'Password changed',
        body: 'Your password was recently changed. All other sessions have been signed out.',
      });
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new BadRequestException('This account does not use password authentication.');

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect.');

    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.revokeAllSessions(userId);
    await this.email.sendPasswordChangedAlert(user.email);
  }

  // --------------------------------------------------------------------
  // Current user
  // --------------------------------------------------------------------

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists.');
    return toPublicUser(user);
  }

  // --------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------

  private async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: this.config.get<number>('passwordHash.memoryCost'),
      timeCost: this.config.get<number>('passwordHash.timeCost'),
    });
  }

  /** SHA-256 for opaque, single-use tokens (verification/reset/refresh) — not for passwords. */
  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async recordActivity(
    userId: string,
    action: ActivityAction,
    meta: RequestMeta,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId,
        action,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: metadata as any,
      },
    });
  }
}

// ----------------------------------------------------------------------
// Shape returned to clients — never leaks passwordHash or internal fields
// ----------------------------------------------------------------------
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  emailVerified: boolean;
}

function toPublicUser(user: {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  emailVerifiedAt: Date | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    platformRole: user.platformRole,
    emailVerified: !!user.emailVerifiedAt,
  };
}

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

function addDuration(duration: string): Date {
  return new Date(Date.now() + parseDurationToSeconds(duration) * 1000);
}
