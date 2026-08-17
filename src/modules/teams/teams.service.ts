import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityAction, NotificationType, OrgRole } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InviteMemberDto } from './dto/invite-member.dto';

const INVITE_TTL_DAYS = 7;

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  // --------------------------------------------------------------------
  // Membership
  // --------------------------------------------------------------------

  async listMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true, displayName: true, avatarUrl: true, lastLoginAt: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async removeMember(organizationId: string, requesterId: string, requesterRole: OrgRole, targetUserId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found.');

    if (targetUserId === org.ownerId) {
      throw new ForbiddenException('The organization owner cannot be removed. Transfer ownership first.');
    }

    const target = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('This user is not a member of the organization.');

    // ADMINs may only remove MEMBERs, not other ADMINs — prevents a lower
    // trust tier from demoting peers. Only OWNER can remove an ADMIN.
    if (requesterRole === OrgRole.ADMIN && target.role !== OrgRole.MEMBER) {
      throw new ForbiddenException('Admins can only remove members, not other admins.');
    }

    await this.prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
    });

    await this.prisma.activityLog.create({
      data: {
        organizationId,
        userId: requesterId,
        action: ActivityAction.MEMBER_REMOVED,
        metadata: { removedUserId: targetUserId },
      },
    });
  }

  async leaveOrganization(organizationId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found.');
    if (org.ownerId === userId) {
      throw new ForbiddenException('The owner cannot leave the organization. Transfer ownership first or delete the organization.');
    }
    await this.prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  async updateMemberRole(organizationId: string, targetUserId: string, role: OrgRole) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found.');

    if (targetUserId === org.ownerId) {
      throw new ForbiddenException("The owner's role cannot be changed directly. Use transfer-ownership instead.");
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
    });
    if (!membership) throw new NotFoundException('This user is not a member of the organization.');

    if (role === OrgRole.OWNER) {
      throw new BadRequestException('Use transfer-ownership to assign a new owner.');
    }

    return this.prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
      data: { role },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
  }

  // --------------------------------------------------------------------
  // Invites
  // --------------------------------------------------------------------

  async inviteMember(organizationId: string, inviterId: string, dto: InviteMemberDto) {
    if (dto.role === OrgRole.OWNER) {
      throw new BadRequestException('Cannot invite someone directly as owner. Invite as admin, then transfer ownership if needed.');
    }

    const [org, inviter] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: organizationId } }),
      this.prisma.user.findUnique({ where: { id: inviterId }, select: { displayName: true } }),
    ]);
    if (!org) throw new NotFoundException('Organization not found.');

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existingUser) {
      const existingMembership = await this.prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: existingUser.id } },
      });
      if (existingMembership) {
        throw new ConflictException('This user is already a member of the organization.');
      }
    }

    const pendingInvite = await this.prisma.organizationInvite.findFirst({
      where: { organizationId, email: dto.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pendingInvite) {
      throw new ConflictException('An invite is already pending for this email.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const invite = await this.prisma.organizationInvite.create({
      data: {
        organizationId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        invitedById: inviterId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    await this.email.sendTeamInviteEmail(dto.email, org.name, inviter?.displayName ?? 'A teammate', rawToken);

    if (existingUser) {
      await this.notifications.create({
        userId: existingUser.id,
        type: NotificationType.TEAM_INVITE,
        title: `You've been invited to join ${org.name}`,
        body: `${inviter?.displayName ?? 'A teammate'} invited you to join as ${dto.role.toLowerCase()}.`,
        metadata: { organizationId, inviteId: invite.id },
      });
    }

    return { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt };
  }

  async acceptInvite(userId: string, userEmail: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const invite = await this.prisma.organizationInvite.findUnique({ where: { tokenHash } });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite is invalid or has expired.');
    }
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('This invite was issued to a different email address.');
    }

    const existingMembership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId } },
    });
    if (existingMembership) {
      await this.prisma.organizationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return existingMembership;
    }

    const [membership] = await this.prisma.$transaction([
      this.prisma.organizationMember.create({
        data: { organizationId: invite.organizationId, userId, role: invite.role },
      }),
      this.prisma.organizationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
    ]);

    return membership;
  }

  async listPendingInvites(organizationId: string) {
    return this.prisma.organizationInvite.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(organizationId: string, inviteId: string) {
    const invite = await this.prisma.organizationInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.organizationId !== organizationId) {
      throw new NotFoundException('Invite not found.');
    }
    await this.prisma.organizationInvite.delete({ where: { id: inviteId } });
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
