import { SetMetadata } from '@nestjs/common';
import { OrgRole } from '@prisma/client';

export const ORG_ROLES_KEY = 'orgRoles';

/**
 * Restricts a route to members holding one of the given roles WITHIN the
 * organization identified by the `:organizationId` route param (or
 * `X-Organization-Id` header — see OrgRolesGuard for resolution order).
 *
 * Deliberately separate from @Roles because org permissions are scoped
 * per-team, not global — a MEMBER of one org can be OWNER of another.
 *
 * @example @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
 */
export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);
