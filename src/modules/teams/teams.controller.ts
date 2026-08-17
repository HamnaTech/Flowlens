import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { TeamsService } from './teams.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrgMembership } from '../../common/decorators/current-org-membership.decorator';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../../common/guards/org-roles.guard';

@Controller({ path: 'organizations/:organizationId/team', version: '1' })
@UseGuards(OrgRolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('members')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
  listMembers(@Param('organizationId') organizationId: string) {
    return this.teamsService.listMembers(organizationId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('members/:userId')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrgMembership() membership: { role: OrgRole },
  ) {
    await this.teamsService.removeMember(organizationId, user.id, membership.role, targetUserId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('leave')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
  async leave(@Param('organizationId') organizationId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.teamsService.leaveOrganization(organizationId, user.id);
  }

  @Patch('members/:userId/role')
  @OrgRoles(OrgRole.OWNER) // only the owner reassigns roles — see TeamsService rationale
  updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(organizationId, targetUserId, dto.role);
  }

  // ---- Invites -------------------------------------------

  @Post('invites')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  inviteMember(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(organizationId, user.id, dto);
  }

  @Get('invites')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  listPendingInvites(@Param('organizationId') organizationId: string) {
    return this.teamsService.listPendingInvites(organizationId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('invites/:inviteId')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  async revokeInvite(@Param('organizationId') organizationId: string, @Param('inviteId') inviteId: string) {
    await this.teamsService.revokeInvite(organizationId, inviteId);
  }
}

// Accepting an invite happens outside any specific org's RBAC context (the
// caller isn't a member yet), so it lives on its own controller without
// OrgRolesGuard rather than being nested under /organizations/:id/team.
@Controller({ path: 'invites', version: '1' })
export class InvitesController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('accept')
  acceptInvite(@CurrentUser() user: AuthenticatedUser, @Body() dto: AcceptInviteDto) {
    return this.teamsService.acceptInvite(user.id, user.email, dto.token);
  }
}
