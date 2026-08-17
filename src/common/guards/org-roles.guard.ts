import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';

// Runs AFTER JwtAuthGuard (request.user must already be populated).
// Resolves organizationId from, in order: route param `:organizationId`,
// then `X-Organization-Id` header, then request body `organizationId` —
// covering GET/DELETE (param), and POST/PATCH (body) call shapes.
@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required.');

    const organizationId =
      request.params?.organizationId ?? request.headers['x-organization-id'] ?? request.body?.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('No organization context provided for this request.');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization.');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Your role in this organization does not permit this action.');
    }

    // Attach for downstream handlers that want to avoid a second query.
    request.orgMembership = membership;
    return true;
  }
}
