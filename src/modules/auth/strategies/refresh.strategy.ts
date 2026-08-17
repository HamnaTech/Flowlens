import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtRefreshPayload {
  sub: string; // userId
  jti: string; // token id, matches RefreshToken.id — enables single-token revocation
}

// Deliberately a SEPARATE strategy/secret from JwtStrategy (access tokens).
// If the access secret ever leaks, refresh tokens remain valid under their
// own secret and vice versa — the two token types are cryptographically
// independent, not just differently-scoped claims on one secret.
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken = req.body?.refreshToken;
    return { ...payload, refreshToken };
  }
}
