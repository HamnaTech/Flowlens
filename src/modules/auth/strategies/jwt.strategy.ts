import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  platformRole: 'USER' | 'ADMIN';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtAccessPayload) {
    // Re-check the user still exists and is active on every request rather
    // than trusting stale JWT claims — a deactivated/deleted account is
    // locked out immediately instead of waiting for token expiry.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, platformRole: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or no longer exists.');
    }

    return { id: user.id, email: user.email, platformRole: user.platformRole };
  }
}
