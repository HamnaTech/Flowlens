import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrgRole } from '@prisma/client';

export const CurrentOrgMembership = createParamDecorator((_: unknown, ctx: ExecutionContext): { role: OrgRole } => {
  const request = ctx.switchToHttp().getRequest();
  return request.orgMembership;
});
