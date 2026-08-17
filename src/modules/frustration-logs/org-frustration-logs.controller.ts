import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';
import { FrustrationLogsService } from './frustration-logs.service';
import { ListFrustrationLogsQueryDto } from './dto/list-frustration-logs-query.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrgMembership } from '../../common/decorators/current-org-membership.decorator';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../../common/guards/org-roles.guard';

@ApiTags('Frustration Logs — Team View')
@ApiBearerAuth()
@Controller({ path: 'organizations/:organizationId/frustration-logs', version: '1' })
@UseGuards(OrgRolesGuard)
export class OrgFrustrationLogsController {
  constructor(private readonly logsService: FrustrationLogsService) {}

  @ApiOperation({
    summary: "Team-wide log view. MEMBERs only ever see their own logs; OWNER/ADMIN see the full team's.",
  })
  @Get()
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
  list(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrgMembership() membership: { role: OrgRole },
    @Query() query: ListFrustrationLogsQueryDto,
  ) {
    return this.logsService.listForOrganization(organizationId, user.id, membership.role, query);
  }
}
