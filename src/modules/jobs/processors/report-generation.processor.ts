import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationType, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CacheHelperService } from '../../../cache/cache-helper.service';
import { JOB_GENERATE_REPORT, QUEUE_REPORT_GENERATION } from '../queue.constants';

interface GenerateReportJobData {
  aiReportId: string;
}

@Processor(QUEUE_REPORT_GENERATION)
export class ReportGenerationProcessor {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly notifications: NotificationsService,
    private readonly cache: CacheHelperService,
  ) {}

  @Process(JOB_GENERATE_REPORT)
  async handleGenerateReport(job: Job<GenerateReportJobData>) {
    const report = await this.prisma.aIReport.findUnique({ where: { id: job.data.aiReportId } });
    if (!report) {
      this.logger.warn(`AIReport ${job.data.aiReportId} not found.`);
      return;
    }

    await this.prisma.aIReport.update({ where: { id: report.id }, data: { status: ReportStatus.PROCESSING } });

    try {
      const logs = await this.prisma.frustrationLog.findMany({
        where: {
          ...(report.userId ? { userId: report.userId } : {}),
          ...(report.organizationId ? { organizationId: report.organizationId } : {}),
          occurredAt: { gte: report.periodStart, lte: report.periodEnd },
        },
        include: { category: true },
      });

      const result = await this.ai.generateReport({
        periodLabel: `${report.period} (${report.periodStart.toDateString()} – ${report.periodEnd.toDateString()})`,
        logs: logs.map((l) => ({
          description: l.description,
          category: l.category?.name ?? null,
          frictionScore: l.frictionScore,
          estimatedMinutesLost: l.estimatedMinutesLost,
          occurredAt: l.occurredAt,
        })),
      });

      const totalMinutesLost = logs.reduce((sum, l) => sum + (l.estimatedMinutesLost ?? 0), 0);
      const avgFrictionScore = logs.length
        ? logs.reduce((sum, l) => sum + (l.frictionScore ?? 0), 0) / logs.length
        : 0;

      const categoryTotals = new Map<string, { minutesLost: number; count: number; categoryId: string }>();
      for (const log of logs) {
        const key = log.category?.name ?? 'Uncategorized';
        const existing = categoryTotals.get(key) ?? { minutesLost: 0, count: 0, categoryId: log.categoryId ?? '' };
        existing.minutesLost += log.estimatedMinutesLost ?? 0;
        existing.count += 1;
        categoryTotals.set(key, existing);
      }
      const topCategories = [...categoryTotals.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.minutesLost - a.minutesLost)
        .slice(0, 5);

      await this.prisma.aIReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.COMPLETED,
          summary: result.summary,
          totalMinutesLost,
          avgFrictionScore,
          burnoutRiskScore: result.burnoutRiskScore,
          topCategories: topCategories as any,
          generatedAt: new Date(),
          recommendations: {
            create: result.recommendations.map((r) => ({
              title: r.title,
              description: r.description,
              category: r.category,
            })),
          },
        },
      });

      if (report.userId) {
        await this.cache.invalidate(CacheHelperService.userDashboardKey(report.userId));

        await this.notifications.create({
          userId: report.userId,
          type: NotificationType.WEEKLY_REPORT_READY,
          title: `Your ${report.period.toLowerCase()} report is ready`,
          body: result.summary.slice(0, 140),
          metadata: { reportId: report.id },
        });

        if (result.burnoutRiskScore >= 0.7) {
          await this.notifications.create({
            userId: report.userId,
            type: NotificationType.BURNOUT_RISK_ALERT,
            title: 'Elevated burnout risk detected',
            body: 'Your recent friction levels suggest you may be approaching burnout. Consider reviewing your top recurring problems.',
            metadata: { reportId: report.id },
          });
        }
      }

      this.logger.log(`Report ${report.id} generated: ${logs.length} logs, ${totalMinutesLost}min lost.`);
    } catch (err) {
      this.logger.error(`Report generation failed for ${report.id}: ${(err as Error).message}`);
      await this.prisma.aIReport.update({
        where: { id: report.id },
        data: { status: ReportStatus.FAILED, failureReason: (err as Error).message },
      });
      throw err; // let BullMQ's retry/backoff handle it
    }
  }
}
