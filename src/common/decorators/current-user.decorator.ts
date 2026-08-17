import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email: string;
  platformRole: 'USER' | 'ADMIN';
}

/**
 * Extracts the authenticated user (set by JwtAuthGuard/JwtStrategy) into a
 * controller parameter: `create(@CurrentUser() user: AuthenticatedUser)`.
 */
export const CurrentUser = createParamDecorator((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user: AuthenticatedUser = request.user;
  return data ? user?.[data] : user;
});
