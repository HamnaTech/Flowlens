import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrgRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CacheHelperService } from '../../cache/cache-helper.service';
import { QUEUE_AI_ANALYSIS, JOB_ANALYZE_LOG } from '../jobs/queue.constants';
import { CreateFrustrationLogDto } from './dto/create-frustration-log.dto';
import { UpdateFrustrationLogDto } from './dto/update-frustration-log.dto';
import { ListFrustrationLogsQueryDto } from './dto/list-frustration-logs-query.dto';
import { buildPaginatedResult, toSkipTake } from '../../common/utils/pagination';

const RECENT_FREQUENCY_WINDOW_DAYS = 30;

// Fields returned to clients on every read — deliberately excludes the raw
// pgvector `embedding` column (Prisma's generated client can't select
// Unsupported("vector") fields anyway) and keeps the shape stable across
// list/detail/create responses so the frontend has one type to work with.
const LOG_SELECT = {
  id: true,
  userId: true,
  organizationId: true,
  categoryId: true,
  description: true,
  source: true,
  frustrationLevel: true,
  estimatedMinutesLost: true,
  location: true,
  occurredAt: true,
  frictionScore: true,
  severityScore: true,
  frequencyScore: true,
  preventabilityScore: true,
  isPubliclyShared: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, color: true, icon: true } },
  tags: { select: { tag: { select: { id: true, name: true } }, addedByAI: true } },
  attachments: {
    select: {
      id: true,
      kind: true,
      status: true,
      publicUrl: true,
      mimeType: true,
      sizeBytes: true,
      durationSeconds: true,
      transcript: true,
      createdAt: true,
    },
  },
  _count: { select: { comments: true } },
} satisfies Prisma.FrustrationLogSelect;

type LogWithRelations = Prisma.FrustrationLogGetPayload<{ select: typeof LOG_SELECT }>;

@Injectable()
export class FrustrationLogsService {
  private readonly logger = new Logger(FrustrationLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly cache: CacheHelperService,
    @InjectQueue(QUEUE_AI_ANALYSIS) private readonly aiQueue: Queue,
  ) {}

  // --------------------------------------------------------------------
  // Create
  // --------------------------------------------------------------------

  async create(userId: string, dto: CreateFrustrationLogDto): Promise<LogWithRelations> {
    if (dto.categoryId) {
      await this.assertCategoryAccessible(dto.categoryId, userId, dto.organizationId);
    }
    if (dto.organizationId) {
      await this.assertOrgMember(dto.organizationId, userId);
    }

    // Cheap, synchronous signal for the preliminary score: how many similar
    // (same-category) logs has this user filed in the last 30 days. This is
    // a single indexed COUNT — not the LLM-derived analysis, so it's safe
    // to run inline without hurting request latency.
    const frequencyCount = dto.categoryId
      ? await this.prisma.frustrationLog.count({
          where: {
            userId,
            categoryId: dto.categoryId,
            occurredAt: { gte: daysAgo(RECENT_FREQUENCY_WINDOW_DAYS) },
          },
        })
      : 0;

    // Preliminary score: severity approximated from the user's own 1-10
    // rating (x10) and preventability defaulted to neutral (50) since we
    // have no AI signal yet. AiAnalysisProcessor overwrites all of this
    // with the real severity/preventability from the LLM moments later —
    // this value only exists so the UI isn't blank while that job runs.
    const preliminaryFrictionScore = this.ai.computeFrictionScore({
      severityScore: dto.frustrationLevel * 10,
      frequencyCount,
      minutesLost: dto.estimatedMinutesLost ?? 0,
      preventabilityScore: 50,
    });

    const log = await this.prisma.$transaction(async (tx) => {
      const created = await tx.frustrationLog.create({
        data: {
          userId,
          organizationId: dto.organizationId,
          categoryId: dto.categoryId,
          description: dto.description,
          source: dto.source,
          frustrationLevel: dto.frustrationLevel,
          estimatedMinutesLost: dto.estimatedMinutesLost,
          location: dto.location,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          isPubliclyShared: dto.isPubliclyShared ?? false,
          frictionScore: preliminaryFrictionScore,
          frequencyScore: frequencyCount,
        },
      });

      if (dto.tags?.length) {
        await this.attachTags(tx, created.id, dto.tags, false);
      }

      return created;
    });

    await this.invalidateDashboardCaches(userId, dto.organizationId);

    // Enqueue the real AI analysis — never awaited inline, never blocks
    // the response. Retries/backoff are handled by the queue's default
    // job options (see QueueModule).
    await this.aiQueue.add(JOB_ANALYZE_LOG, { frustrationLogId: log.id }, { jobId: `analyze-${log.id}` });

    return this.findByIdOrThrow(log.id);
  }

  // --------------------------------------------------------------------
  // Read
  // --------------------------------------------------------------------

  async findOne(userId: string, logId: string): Promise<LogWithRelations> {
    const log = await this.findByIdOrThrow(logId);
    this.assertOwnership(log, userId);
    return log;
  }

  async listForUser(userId: string, query: ListFrustrationLogsQueryDto) {
    const where: Prisma.FrustrationLogWhereInput = {
      userId,
      ...this.buildSharedFilters(query),
    };
    return this.paginatedQuery(where, query);
  }

  /**
   * Team view. `requesterRole` is populated by OrgRolesGuard on the
   * controller before this is ever called, so by the time we're here the
   * caller is already confirmed to be a member of `organizationId`.
   */
  async listForOrganization(organizationId: string, requesterId: string, requesterRole: OrgRole, query: ListFrustrationLogsQueryDto) {
    const restrictToSelf = requesterRole === OrgRole.MEMBER || query.mineOnly;

    const where: Prisma.FrustrationLogWhereInput = {
      organizationId,
      ...(restrictToSelf ? { userId: requesterId } : {}),
      ...this.buildSharedFilters(query),
    };
    return this.paginatedQuery(where, query);
  }

  private buildSharedFilters(query: ListFrustrationLogsQueryDto): Prisma.FrustrationLogWhereInput {
    const filters: Prisma.FrustrationLogWhereInput = {};

    if (query.search) {
      filters.description = { contains: query.search, mode: 'insensitive' };
    }
    if (query.categoryId) filters.categoryId = query.categoryId;
    if (query.source) filters.source = query.source;
    if (query.tag) {
      filters.tags = { some: { tag: { name: query.tag } } };
    }
    if (query.minFrustrationLevel !== undefined || query.maxFrustrationLevel !== undefined) {
      filters.frustrationLevel = {
        ...(query.minFrustrationLevel !== undefined ? { gte: query.minFrustrationLevel } : {}),
        ...(query.maxFrustrationLevel !== undefined ? { lte: query.maxFrustrationLevel } : {}),
      };
    }
    if (query.minFrictionScore !== undefined || query.maxFrictionScore !== undefined) {
      filters.frictionScore = {
        ...(query.minFrictionScore !== undefined ? { gte: query.minFrictionScore } : {}),
        ...(query.maxFrictionScore !== undefined ? { lte: query.maxFrictionScore } : {}),
      };
    }
    if (query.startDate || query.endDate) {
      filters.occurredAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    return filters;
  }

  private async paginatedQuery(where: Prisma.FrustrationLogWhereInput, query: ListFrustrationLogsQueryDto) {
    const { skip, take } = toSkipTake(query.page, query.pageSize);
    // sortBy/sortOrder are validated against a fixed IsIn() allowlist in
    // the DTO, so building the orderBy object dynamically here is safe
    // from injection — there's no free-text path into this key.
    const orderBy = { [query.sortBy ?? 'occurredAt']: query.sortOrder ?? 'desc' };

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.frustrationLog.findMany({ where, select: LOG_SELECT, orderBy, skip, take }),
      this.prisma.frustrationLog.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, query.page, query.pageSize);
  }

  // --------------------------------------------------------------------
  // Update
  // --------------------------------------------------------------------

  async update(userId: string, logId: string, dto: UpdateFrustrationLogDto): Promise<LogWithRelations> {
    const existing = await this.findByIdOrThrow(logId);
    this.assertOwnership(existing, userId);

    if (dto.categoryId) {
      await this.assertCategoryAccessible(dto.categoryId, userId, existing.organizationId ?? undefined);
    }

    // Any change to the content that fed the original AI analysis
    // (description or self-rated level) invalidates the previous scores —
    // re-run analysis rather than leave stale AI output attached to
    // edited content.
    const needsReanalysis =
      (dto.description !== undefined && dto.description !== existing.description) ||
      (dto.frustrationLevel !== undefined && dto.frustrationLevel !== existing.frustrationLevel);

    await this.prisma.$transaction(async (tx) => {
      await tx.frustrationLog.update({
        where: { id: logId },
        data: {
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.frustrationLevel !== undefined ? { frustrationLevel: dto.frustrationLevel } : {}),
          ...(dto.estimatedMinutesLost !== undefined ? { estimatedMinutesLost: dto.estimatedMinutesLost } : {}),
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.occurredAt !== undefined ? { occurredAt: new Date(dto.occurredAt) } : {}),
          ...(dto.location !== undefined ? { location: dto.location } : {}),
          ...(dto.isPubliclyShared !== undefined ? { isPubliclyShared: dto.isPubliclyShared } : {}),
        },
      });

      if (dto.tags) {
        await tx.logTag.deleteMany({ where: { frustrationLogId: logId, addedByAI: false } });
        await this.attachTags(tx, logId, dto.tags, false);
      }
    });

    await this.invalidateDashboardCaches(userId, existing.organizationId ?? undefined);

    if (needsReanalysis) {
      await this.aiQueue.add(
        JOB_ANALYZE_LOG,
        { frustrationLogId: logId },
        { jobId: `analyze-${logId}-${Date.now()}` }, // unique jobId since a prior analyze- job for this id may already exist/completed
      );
    }

    return this.findByIdOrThrow(logId);
  }

  // --------------------------------------------------------------------
  // Delete (soft)
  // --------------------------------------------------------------------

  async softDelete(userId: string, logId: string): Promise<void> {
    const existing = await this.findByIdOrThrow(logId);
    this.assertOwnership(existing, userId);

    await this.prisma.frustrationLog.update({ where: { id: logId }, data: { deletedAt: new Date() } });
    await this.invalidateDashboardCaches(userId, existing.organizationId ?? undefined);
  }

  // --------------------------------------------------------------------
  // Tag autocomplete — the one legitimately cacheable read in this module
  // --------------------------------------------------------------------

  async suggestTags(search: string): Promise<string[]> {
    const cacheKey = `tag-suggestions:${search.toLowerCase()}`;
    return this.cache.getOrSet(cacheKey, 300, async () => {
      const tags = await this.prisma.tag.findMany({
        where: { name: { contains: search, mode: 'insensitive' } },
        take: 10,
        orderBy: { name: 'asc' },
        select: { name: true },
      });
      return tags.map((t) => t.name);
    });
  }

  // --------------------------------------------------------------------
  // Ownership / access control
  // --------------------------------------------------------------------

  private assertOwnership(log: { userId: string }, requesterId: string): void {
    if (log.userId !== requesterId) {
      // NotFound, not Forbidden — do not confirm to an unauthorized caller
      // that a log with this ID exists at all.
      throw new NotFoundException('Frustration log not found.');
    }
  }

  private async assertOrgMember(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization.');
    }
  }

  private async assertCategoryAccessible(categoryId: string, userId: string, organizationId?: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Category does not exist.');

    if (!category.isActive) {
      throw new BadRequestException('This category has been archived and can no longer be assigned to logs.');
    }

    const belongsToUser = category.userId === userId;
    const belongsToOrg = organizationId && category.organizationId === organizationId;

    if (!belongsToUser && !belongsToOrg) {
      throw new ForbiddenException('This category does not belong to you or the specified organization.');
    }
  }

  // --------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------

  private async findByIdOrThrow(logId: string): Promise<LogWithRelations> {
    const log = await this.prisma.frustrationLog.findFirst({ where: { id: logId }, select: LOG_SELECT });
    if (!log) throw new NotFoundException('Frustration log not found.');
    return log;
  }

  private async attachTags(tx: Prisma.TransactionClient, logId: string, tagNames: string[], addedByAI: boolean): Promise<void> {
    for (const rawName of tagNames) {
      const name = rawName.trim().toLowerCase();
      if (!name) continue;
      const tag = await tx.tag.upsert({ where: { name }, create: { name }, update: {} });
      await tx.logTag.upsert({
        where: { frustrationLogId_tagId: { frustrationLogId: logId, tagId: tag.id } },
        create: { frustrationLogId: logId, tagId: tag.id, addedByAI },
        update: {},
      });
    }
  }

  private async invalidateDashboardCaches(userId: string, organizationId?: string): Promise<void> {
    await this.cache.invalidate(CacheHelperService.userDashboardKey(userId));
    if (organizationId) {
      await this.cache.invalidate(CacheHelperService.orgDashboardKey(organizationId));
    }
  }
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
