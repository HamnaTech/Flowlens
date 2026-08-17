import { useQuery } from '@tanstack/react-query';
import { frustrationLogsApi } from '@/api/frustration-logs.api';

const SAMPLE_SIZE = 100;

export interface CategoryStats {
  count: number;
  avgFriction: number | null;
  minutesLost: number;
  percentOfTotal: number;
}

/**
 * The categories list endpoint only returns a raw log count per category
 * (_count.frustrationLogs) — there's no backend aggregate for per-category
 * friction/time-lost. Rather than invent a new endpoint or fake the
 * numbers, this reuses the same real logs endpoint the Dashboard already
 * pulls from and computes real per-category stats client-side, over the
 * same recent sample. Honest about being sample-based, same as dashboard.
 */
export function useCategoryStats() {
  const logsQuery = useQuery({
    queryKey: ['category-stats', 'logs-sample'],
    queryFn: () => frustrationLogsApi.list({ pageSize: SAMPLE_SIZE, sortBy: 'occurredAt', sortOrder: 'desc' }),
  });

  const logs = logsQuery.data?.data ?? [];
  const totalMinutes = logs.reduce((sum, l) => sum + (l.estimatedMinutesLost ?? 0), 0);

  function statsFor(categoryId: string): CategoryStats {
    const inCategory = logs.filter((l) => l.categoryId === categoryId);
    const scored = inCategory.filter((l) => l.frictionScore !== null);
    const minutesLost = inCategory.reduce((sum, l) => sum + (l.estimatedMinutesLost ?? 0), 0);
    return {
      count: inCategory.length,
      avgFriction: scored.length ? scored.reduce((s, l) => s + l.frictionScore!, 0) / scored.length : null,
      minutesLost,
      percentOfTotal: totalMinutes > 0 ? (minutesLost / totalMinutes) * 100 : 0,
    };
  }

  return { isLoading: logsQuery.isLoading, sampleSize: logs.length, statsFor };
}
