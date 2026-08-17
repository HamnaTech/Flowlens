import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';

export const ROLES_KEY = 'platformRoles';

/**
 * Restricts a route to specific PLATFORM roles (independent of org
 * membership). Use for internal admin tooling, not team permissions —
 * see OrgRoles decorator for that.
 *
 * @example @Roles(PlatformRole.ADMIN)
 */
export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
