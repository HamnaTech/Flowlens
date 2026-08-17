import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RefreshTokenRequestUser {
  sub: string;
  jti: string;
}

export const CurrentRefreshToken = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RefreshTokenRequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
