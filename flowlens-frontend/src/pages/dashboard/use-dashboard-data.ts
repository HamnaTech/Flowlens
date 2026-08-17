import { useQuery } from '@tanstack/react-query';
import { frustrationLogsApi } from '@/api/frustration-logs.api';
import { categoriesApi } from '@/api/categories.api';
import { reportsApi } from '@/api/reports.api';

const RECENT_SAMPLE_SIZE = 50;

export function useDashboardData() {
  const recentLogsQuery = useQuery({
    queryKey: ['dashboard', 'recent-logs'],
    queryFn: () => frustrationLogsApi.list({ pageSize: RECENT_SAMPLE_SIZE, sortBy: 'occurredAt', sortOrder: 'desc' }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['dashboard', 'categories'],
    queryFn: () => categoriesApi.list({ pageSize: 50 }),
  });

  const reportsQuery = useQuery({
    queryKey: ['dashboard', 'recent-reports'],
    queryFn: () => reportsApi.list({ pageSize: 3 }),
  });

  const logs = recentLogsQuery.data?.data ?? [];
  const scored = logs.filter((l) => l.frictionScore !== null);

  const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

  const stats = {
    totalLogs: recentLogsQuery.data?.meta.totalItems ?? 0,
    avgFrictionScore: avg(scored.map((l) => l.frictionScore!)),
    avgSeverity: avg(scored.filter((l) => l.severityScore !== null).map((l) => l.severityScore!)),
    avgFrequency: avg(scored.filter((l) => l.frequencyScore !== null).map((l) => l.frequencyScore!)),
    avgPreventability: avg(scored.filter((l) => l.preventabilityScore !== null).map((l) => l.preventabilityScore!)),
    totalMinutesLost: logs.reduce((sum, l) => sum + (l.estimatedMinutesLost ?? 0), 0),
    sampleSize: logs.length,
  };

  const categoryBreakdown = (categoriesQuery.data?.data ?? [])
    .map((c) => ({ id: c.id, name: c.name, color: c.color, count: c._count?.frustrationLogs ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    isLoading: recentLogsQuery.isLoading || categoriesQuery.isLoading || reportsQuery.isLoading,
    isError: recentLogsQuery.isError || categoriesQuery.isError,
    recentLogs: logs.slice(0, 5),
    stats,
    categoryBreakdown,
    recentReports: reportsQuery.data?.data ?? [],
    refetch: () => {
      recentLogsQuery.refetch();
      categoriesQuery.refetch();
      reportsQuery.refetch();
    },
  };
}
