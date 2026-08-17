import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheHelperService } from '../../cache/cache-helper.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheHelperService,
  ) {}

  async create(ownerId: string, dto: CreateOrganizationDto) {
    const baseSlug = this.slugify(dto.slug ?? dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Org creation + owner membership must succeed together — an org with
    // no OWNER member is an inconsistent state that would break every
    // OrgRolesGuard check against it.
    const organization = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.name, slug, ownerId },
      });
      await tx.organizationMember.create({
        data: { organizationId: org.id, userId: ownerId, role: OrgRole.OWNER },
      });
      // Seed default categories so a new team isn't starting from a blank
      // slate — mirrors the personal-account onboarding defaults.
      await tx.category.createMany({
        data: [
          { name: 'Meetings', color: '#D14A2D', isSystem: true, organizationId: org.id },
          { name: 'Software & tools', color: '#2F6F62', isSystem: true, organizationId: org.id },
          { name: 'Approvals', color: '#B8391E', isSystem: true, organizationId: org.id },
          { name: 'Files & search', color: '#4A5D57', isSystem: true, organizationId: org.id },
        ],
      });
      return org;
    });

    return organization;
  }

  async findById(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { members: true, frustrationLogs: true } } },
    });
    if (!org) throw new NotFoundException('Organization not found.');
    return org;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: { include: { _count: { select: { members: true } } } } },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.organization, myRole: m.role }));
  }

  async update(organizationId: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.ssoEnabled !== undefined ? { ssoEnabled: dto.ssoEnabled } : {}),
      },
    });
    await this.cache.invalidate(CacheHelperService.orgDashboardKey(organizationId));
    return org;
  }

  /** Only the current OWNER may transfer ownership, and only to an existing member. */
  async transferOwnership(organizationId: string, currentOwnerId: string, newOwnerId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found.');
    if (org.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only the current owner can transfer ownership.');
    }
    if (newOwnerId === currentOwnerId) {
      throw new BadRequestException('This user already owns the organization.');
    }

    const targetMembership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: newOwnerId } },
    });
    if (!targetMembership) {
      throw new BadRequestException('The new owner must already be a member of this organization.');
    }

    await this.prisma.$transaction([
      this.prisma.organization.update({ where: { id: organizationId }, data: { ownerId: newOwnerId } }),
      this.prisma.organizationMember.update({
        where: { organizationId_userId: { organizationId, userId: newOwnerId } },
        data: { role: OrgRole.OWNER },
      }),
      this.prisma.organizationMember.update({
        where: { organizationId_userId: { organizationId, userId: currentOwnerId } },
        data: { role: OrgRole.ADMIN },
      }),
    ]);
  }

  /** Only the OWNER may delete an org; cascades per Prisma schema onDelete rules. */
  async delete(organizationId: string, requesterId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found.');
    if (org.ownerId !== requesterId) {
      throw new ForbiddenException('Only the organization owner can delete it.');
    }
    await this.prisma.organization.delete({ where: { id: organizationId } });
  }

  // --------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base || 'team';
    let suffix = 0;
    // Bounded retry — collision odds shrink fast with an incrementing
    // suffix; 20 attempts is generous headroom before treating it as a
    // genuine error rather than looping indefinitely.
    while (suffix < 20) {
      const existing = await this.prisma.organization.findUnique({ where: { slug: candidate } });
      if (!existing) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    throw new ConflictException('Could not generate a unique organization slug. Please provide one explicitly.');
  }
}
