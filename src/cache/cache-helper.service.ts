import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * Cache-aside helper. Used for expensive, read-heavy aggregates that don't
 * need to be real-time: dashboard summary stats, friction score rollups,
 * category breakdowns. Anything the user expects to update instantly on
 * write (e.g. the log they just created appearing in their own list)
 * should NOT go through this — read it straight from Postgres.
 */
@Injectable()
export class CacheHelperService {
  private readonly logger = new Logger(CacheHelperService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }
    const fresh = await loader();
    await this.cache.set(key, fresh, ttlSeconds * 1000);
    return fresh;
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.del(key);
  }

  /** Invalidate every cache key matching a prefix, e.g. all dashboard keys for a user. */
  async invalidateByPrefix(prefix: string): Promise<void> {
    const store: any = (this.cache as any).store;
    if (typeof store?.keys === 'function') {
      const keys: string[] = await store.keys(`${prefix}*`);
      await Promise.all(keys.map((k) => this.cache.del(k)));
    } else {
      this.logger.warn(`Cache store does not support key scanning; skipping prefix invalidation for ${prefix}`);
    }
  }

  /**
   * Atomic-ish increment with TTL, used for rate-limit / lockout counters
   * (e.g. failed login attempts per email). Not a true atomic INCR since
   * the underlying cache-manager store abstraction doesn't expose one
   * uniformly across backends, but read-modify-write is acceptable here:
   * worst case under race is off-by-one on a security throttle, not a
   * correctness-critical counter.
   */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const current = (await this.cache.get<number>(key)) ?? 0;
    const next = current + 1;
    await this.cache.set(key, next, ttlSeconds * 1000);
    return next;
  }

  static userDashboardKey(userId: string): string {
    return `dashboard:user:${userId}`;
  }

  static orgDashboardKey(organizationId: string): string {
    return `dashboard:org:${organizationId}`;
  }

  static frictionScoreKey(userId: string, period: string): string {
    return `friction-score:${userId}:${period}`;
  }
}
