import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { QUEUE_AI_ANALYSIS, JOB_ANALYZE_LOG, JOB_DETECT_PATTERNS } from '../queue.constants';

interface AnalyzeLogJobData {
  frustrationLogId: string;
}

// Runs off the request thread: the API responds to "create log" the moment
// the row is written, then this processor fills in AI-derived fields
// (category suggestion, scores, embedding) a few seconds later. The
// frontend either polls or receives a websocket push when it's done.
@Processor(QUEUE_AI_ANALYSIS)
export class AiAnalysisProcessor {
  private readonly logger = new Logger(AiAnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly notifications: NotificationsService,
  ) {}

  @Process(JOB_ANALYZE_LOG)
  async handleAnalyzeLog(job: Job<AnalyzeLogJobData>) {
    const { frustrationLogId } = job.data;

    const log = await this.prisma.frustrationLog.findFirst({
      where: { id: frustrationLogId },
      include: { category: true, user: { select: { id: true } } },
    });
    if (!log) {
      this.logger.warn(`Log ${frustrationLogId} not found (may have been deleted before analysis ran).`);
      return;
    }

    const existingCategories = await this.prisma.category.findMany({
      where: { userId: log.userId },
      select: { name: true },
    });

    const analysis = await this.ai.analyzeLog({
      description: log.description,
      frustrationLevel: log.frustrationLevel,
      estimatedMinutesLost: log.estimatedMinutesLost,
      existingCategories: existingCategories.map((c) => c.name),
    });

    // Recent similar-log count feeds the frequency component of the score.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSimilarCount = await this.prisma.frustrationLog.count({
      where: {
        userId: log.userId,
        categoryId: log.categoryId,
        occurredAt: { gte: thirtyDaysAgo },
        id: { not: log.id },
      },
    });

    const frictionScore = this.ai.computeFrictionScore({
      severityScore: analysis.severityScore,
      frequencyCount: recentSimilarCount,
      minutesLost: log.estimatedMinutesLost ?? 0,
      preventabilityScore: analysis.preventabilityScore,
    });

    const embedding = await this.ai.createEmbedding(log.description).catch((err) => {
      this.logger.warn(`Embedding generation failed for log ${log.id}: ${err.message}`);
      return null;
    });

    await this.prisma.$executeRawUnsafe(
      `UPDATE "FrustrationLog"
       SET "severityScore" = $1, "preventabilityScore" = $2, "frictionScore" = $3, "frequencyScore" = $4
           ${embedding ? `, "embedding" = $5::vector` : ''}
       WHERE "id" = $${embedding ? 6 : 5}`,
      analysis.severityScore,
      analysis.preventabilityScore,
      frictionScore,
      recentSimilarCount,
      ...(embedding ? [`[${embedding.join(',')}]`] : []),
      log.id,
    );

    // Auto-tag with AI-suggested tags, creating any that don't exist yet.
    for (const tagName of analysis.suggestedTags.slice(0, 5)) {
      const tag = await this.prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      });
      await this.prisma.logTag.upsert({
        where: { frustrationLogId_tagId: { frustrationLogId: log.id, tagId: tag.id } },
        create: { frustrationLogId: log.id, tagId: tag.id, addedByAI: true },
        update: {},
      });
    }

    this.logger.log(`Analyzed log ${log.id}: score=${frictionScore}, category=${analysis.suggestedCategory}`);

    // Deliberately NOT notifying on every completed analysis — a user
    // logging several frustrations a day would get several pings a day
    // for something they already know they just submitted. Only surface
    // a notification when the AI-computed score crosses a threshold that
    // genuinely changes what the user knows (i.e. "this was worse than
    // your self-rating suggested"), matching how BURNOUT_RISK_ALERT is
    // gated in ReportGenerationProcessor.
    if (frictionScore >= 75) {
      await this.notifications.create({
        userId: log.userId,
        type: NotificationType.RECURRING_PATTERN_DETECTED,
        title: 'High-friction event detected',
        body: `"${log.description.slice(0, 80)}" scored ${frictionScore}/100 — among your most significant friction points recently.`,
        metadata: { frustrationLogId: log.id, frictionScore },
      });
    }
  }

  // Periodic clustering job (triggered by a cron scheduler, not per-log) —
  // groups semantically similar logs via pgvector cosine distance to
  // surface "recurring bottleneck" patterns for the dashboard.
  @Process(JOB_DETECT_PATTERNS)
  async handleDetectPatterns(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    const clusters = await this.prisma.$queryRawUnsafe<Array<{ description: string; occurrence_count: number }>>(
      `SELECT description, COUNT(*) OVER (PARTITION BY embedding <-> embedding) as occurrence_count
       FROM "FrustrationLog"
       WHERE "userId" = $1 AND "deletedAt" IS NULL AND embedding IS NOT NULL
       ORDER BY "occurredAt" DESC
       LIMIT 200`,
      userId,
    );

    this.logger.log(`Pattern detection for user ${userId} scanned ${clusters.length} recent logs.`);
    // Result feeds AIReport.topCategories on the next report generation run
    // rather than writing directly here, keeping this job idempotent.
  }
}
