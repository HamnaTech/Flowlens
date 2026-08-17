import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestMeta } from '../../modules/auth/auth.service';

export const ReqMeta = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestMeta => {
  const request = ctx.switchToHttp().getRequest();
  return {
    ipAddress: request.ip ?? request.headers['x-forwarded-for'],
    userAgent: request.headers['user-agent'],
  };
});
