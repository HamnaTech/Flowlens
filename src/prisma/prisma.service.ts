import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    super({
      datasources: { db: { url: config.get<string>('database.url') } },
      log:
        config.get<string>('nodeEnv') === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Slow query logging — anything over 200ms in dev is worth knowing
    // about before it becomes a production incident. Wire to APM
    // (Datadog/Sentry) transport instead of console in production.
    if (this.config.get<string>('nodeEnv') === 'development') {
      // @ts-expect-error - Prisma event typing quirk with generated client
      this.$on('query', (event: { query: string; duration: number }) => {
        if (event.duration > 200) {
          this.logger.warn(`Slow query (${event.duration}ms): ${event.query}`);
        }
      });
    }

    // Global soft-delete enforcement for FrustrationLog: any find* call
    // automatically excludes deletedAt rows unless explicitly overridden
    // with { where: { deletedAt: { not: null } } } by the caller. This
    // prevents every service method from having to remember the filter.
    this.$use(async (params, next) => {
      if (params.model === 'FrustrationLog') {
        if (['findUnique', 'findFirst'].includes(params.action)) {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Used by health checks and readiness probes. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
