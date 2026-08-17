import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheHelperService } from '../../cache/cache-helper.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { buildPaginatedResult, toSkipTake } from '../../common/utils/pagination';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheHelperService,
  ) {}

  // --------------------------------------------------------------------
  // Self-service
  // --------------------------------------------------------------------

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        timezone: true,
        platformRole: true,
        emailVerifiedAt: true,
        onboardingStep: true,
        createdAt: true,
        _count: { select: { frustrationLogs: true, organizationMemberships: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    if (dto.timezone && !this.isValidTimezone(dto.timezone)) {
      throw new BadRequestException(`"${dto.timezone}" is not a recognized IANA timezone.`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
      select: { id: true, email: true, displayName: true, avatarUrl: true, timezone: true },
    });

    await this.cache.invalidate(CacheHelperService.userDashboardKey(userId));
    return user;
  }

  async advanceOnboarding(userId: string, step: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: step },
      select: { onboardingStep: true },
    });
  }

  /**
   * Soft-deactivation, not hard delete — preserves referential integrity
   * for org data, billing history, and audit trail. A true GDPR erasure
   * (scrubbing PII while retaining anonymized aggregate rows) is a
   * separate, deliberate admin/compliance action — see requestDataErasure.
   */
  async deactivateAccount(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  /**
   * GDPR "right to erasure" — scrubs personally identifying fields while
   * leaving the row (and its historical FKs) intact, since FrustrationLog,
   * ActivityLog, and Invoice rows must survive for other users'/orgs'
   * referential and legal-retention needs. CommunityContribution rows are
   * already anonymized by design and are untouched.
   */
  async requestDataErasure(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `erased-${userId}@deleted.flowlens.ai`,
        displayName: 'Deleted User',
        avatarUrl: null,
        passwordHash: null,
        isActive: false,
      },
    });
    await this.prisma.oAuthAccount.deleteMany({ where: { userId } });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private isValidTimezone(tz: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }

  // --------------------------------------------------------------------
  // Admin (PlatformRole.ADMIN only — enforced via RolesGuard at controller)
  // --------------------------------------------------------------------

  async listUsers(query: ListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { platformRole: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { displayName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query.page, query.pageSize);

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          platformRole: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, query.page, query.pageSize);
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        platformRole: true,
        isActive: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updateUserRole(actingAdminId: string, targetUserId: string, dto: UpdateUserRoleDto) {
    if (actingAdminId === targetUserId) {
      throw new ForbiddenException('You cannot change your own platform role.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found.');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { platformRole: dto.role },
      select: { id: true, email: true, platformRole: true },
    });
  }

  async setUserActive(targetUserId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }
}
