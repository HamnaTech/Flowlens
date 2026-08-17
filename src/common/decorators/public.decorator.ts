import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as exempt from the global JwtAuthGuard. Auth is applied
 * app-wide by default (secure-by-default) — this is the explicit opt-out
 * for login, register, refresh, health checks, and public webhooks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
