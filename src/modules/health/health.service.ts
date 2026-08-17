import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_AI_ANALYSIS } from '../jobs/queue.constants';

export type HealthState = 'ok' | 'degraded' | 'down';

export interface ComponentHealth {
  status: HealthState;
  latencyMs?: number;
  message?: string;
}

export interface HealthReport {
  status: HealthState;
  timestamp: string;
  uptimeSeconds: number;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    queue: ComponentHealth;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectQueue(QUEUE_AI_ANALYSIS) private readonly queue: Queue,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, cache, queue] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkQueue(),
    ]);

    const components = { database, cache, queue };
    const overall = this.aggregateStatus(Object.values(components));

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      components,
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const healthy = await this.prisma.isHealthy();
      const latencyMs = Date.now() - start;
      // No connection string, credentials, or query text in the response —
      // only a boolean-derived status and timing.
      return healthy ? { status: 'ok', latencyMs } : { status: 'down', latencyMs, message: 'Database query failed.' };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start, message: 'Database is unreachable.' };
    }
  }

  private async checkCache(): Promise<ComponentHealth> {
    const start = Date.now();
    const probeKey = '__health_probe__';
    try {
      await this.cache.set(probeKey, '1', 5000);
      const value = await this.cache.get(probeKey);
      const latencyMs = Date.now() - start;
      return value === '1'
        ? { status: 'ok', latencyMs }
        : { status: 'degraded', latencyMs, message: 'Cache round-trip returned an unexpected value.' };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start, message: 'Redis cache is unreachable.' };
    }
  }

  private async checkQueue(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      // Bull's underlying ioredis client — a raw PING is the cheapest
      // possible liveness check and doesn't touch job data at all.
      const pong = await this.queue.client.ping();
      const latencyMs = Date.now() - start;
      return pong === 'PONG'
        ? { status: 'ok', latencyMs }
        : { status: 'degraded', latencyMs, message: 'Unexpected response from queue Redis connection.' };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start, message: 'BullMQ/Redis connection is unreachable.' };
    }
  }

  private aggregateStatus(components: ComponentHealth[]): HealthState {
    if (components.some((c) => c.status === 'down')) return 'down';
    if (components.some((c) => c.status === 'degraded')) return 'degraded';
    return 'ok';
  }
}
