import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Prisma, ReportPeriod, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResult, toSkipTake } from '../../common/utils/pagination';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { JOB_GENERATE_REPORT, QUEUE_REPORT_GENERATION } from '../jobs/queue.constants';

const REPORT_INCLUDE = {
    recommendations: true,
    organization: { select: { id: true, name: true, slug: true } },
    user: { select: { id: true, displayName: true, email: true } },
} satisfies Prisma.AIReportInclude;

type ReportWithRelations = Prisma.AIReportGetPayload<{ include: typeof REPORT_INCLUDE }>;

@Injectable()
export class ReportsService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue(QUEUE_REPORT_GENERATION) private readonly reportQueue: Queue,
    ) { }

    async createForUser(userId: string, dto: CreateReportDto) {
        return this.createReport({ userId }, dto);
    }

    async createForOrganization(organizationId: string, userId: string, dto: CreateReportDto) {
        return this.createReport({ organizationId, userId }, dto);
    }

    async listForUser(userId: string, query: ListReportsQueryDto) {
        return this.paginatedQuery({ userId, ...this.buildFilters(query) }, query);
    }

    async findOneForUser(userId: string, reportId: string): Promise<ReportWithRelations> {
        const report = await this.prisma.aIReport.findFirst({
            where: { id: reportId, userId },
            include: REPORT_INCLUDE,
        });
        if (!report) throw new NotFoundException('AI report not found.');
        return report;
    }

    async listForOrganization(organizationId: string, query: ListReportsQueryDto) {
        return this.paginatedQuery({ organizationId, ...this.buildFilters(query) }, query);
    }

    async findOneForOrganization(organizationId: string, reportId: string): Promise<ReportWithRelations> {
        const report = await this.prisma.aIReport.findFirst({
            where: { id: reportId, organizationId },
            include: REPORT_INCLUDE,
        });
        if (!report) throw new NotFoundException('AI report not found.');
        return report;
    }

    private buildFilters(query: ListReportsQueryDto): Prisma.AIReportWhereInput {
        return {
            ...(query.period ? { period: query.period } : {}),
            ...(query.status ? { status: query.status } : {}),
        };
    }

    private async createReport(
        scope: { userId?: string; organizationId?: string },
        dto: CreateReportDto,
    ): Promise<ReportWithRelations> {
        const window = this.resolveWindow(dto.period, dto.periodStart, dto.periodEnd);

        const existing = await this.prisma.aIReport.findFirst({
            where: {
                ...(scope.userId ? { userId: scope.userId } : {}),
                ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
                period: dto.period,
                periodStart: window.periodStart,
                periodEnd: window.periodEnd,
                status: { in: [ReportStatus.PENDING, ReportStatus.PROCESSING, ReportStatus.COMPLETED] },
            },
            include: REPORT_INCLUDE,
        });

        if (existing) {
            return existing;
        }

        const report = await this.prisma.aIReport.create({
            data: {
                ...(scope.userId ? { userId: scope.userId } : {}),
                ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
                period: dto.period,
                periodStart: window.periodStart,
                periodEnd: window.periodEnd,
                status: ReportStatus.PENDING,
            },
            include: REPORT_INCLUDE,
        });

        await this.reportQueue.add(JOB_GENERATE_REPORT, { aiReportId: report.id }, { jobId: `generate-report-${report.id}` });

        return report;
    }

    private async paginatedQuery(where: Prisma.AIReportWhereInput, query: ListReportsQueryDto) {
        const { skip, take } = toSkipTake(query.page, query.pageSize);
        const [items, totalItems] = await this.prisma.$transaction([
            this.prisma.aIReport.findMany({
                where,
                include: REPORT_INCLUDE,
                orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
                skip,
                take,
            }),
            this.prisma.aIReport.count({ where }),
        ]);

        return buildPaginatedResult(items, totalItems, query.page, query.pageSize);
    }

    private resolveWindow(period: ReportPeriod, periodStart?: string, periodEnd?: string) {
        if (periodStart || periodEnd) {
            if (!periodStart || !periodEnd) {
                throw new BadRequestException('Both periodStart and periodEnd are required when providing a custom report window.');
            }

            const start = new Date(periodStart);
            const end = new Date(periodEnd);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
                throw new BadRequestException('The report window must be valid ISO dates and periodStart must be before periodEnd.');
            }
            return { periodStart: start, periodEnd: end };
        }

        const now = new Date();
        switch (period) {
            case ReportPeriod.DAILY:
                return { periodStart: startOfUtcDay(now), periodEnd: now };
            case ReportPeriod.WEEKLY:
                return { periodStart: startOfUtcWeek(now), periodEnd: now };
            case ReportPeriod.MONTHLY:
                return { periodStart: startOfUtcMonth(now), periodEnd: now };
        }
    }
}

function startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function startOfUtcWeek(date: Date): Date {
    const day = date.getUTCDay();
    const diff = (day + 6) % 7;
    const start = new Date(date);
    start.setUTCDate(date.getUTCDate() - diff);
    return startOfUtcDay(start);
}

function startOfUtcMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}