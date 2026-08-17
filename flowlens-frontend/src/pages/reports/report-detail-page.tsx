import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Loader2, Sparkles, TrendingDown, XCircle } from 'lucide-react';
import { reportsApi } from '@/api/reports.api';
import { getErrorMessage } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState, ReportSkeleton } from '@/components/empty-error-states';
import { AIProcessingStages } from '@/components/ai-processing-stages';
import { formatDate, formatMinutes } from '@/lib/utils';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();

  const reportQuery = useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsApi.get(id!),
    enabled: !!id,
    // Reports are generated asynchronously (PENDING -> PROCESSING ->
    // COMPLETED/FAILED). Poll while still in flight so the page updates
    // itself once the AI worker finishes, same pattern as log detail.
    refetchInterval: (query) => (['PENDING', 'PROCESSING'].includes(query.state.data?.status ?? '') ? 3000 : false),
  });

  if (reportQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <ReportSkeleton rows={4} />
      </div>
    );
  }

  if (reportQuery.isError || !reportQuery.data) {
    return <ErrorState message={getErrorMessage(reportQuery.error) || 'Report not found.'} onRetry={() => reportQuery.refetch()} />;
  }

  const report = reportQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to reports
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {report.period.charAt(0) + report.period.slice(1).toLowerCase()} report
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium ${
                report.status === 'COMPLETED'
                  ? 'text-success'
                  : report.status === 'PROCESSING'
                    ? 'text-warning-foreground'
                    : report.status === 'FAILED'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
              }`}
            >
              {report.status === 'PROCESSING' && <Loader2 className="h-3 w-3 animate-spin" />}
              {report.status === 'COMPLETED' ? 'Completed' : report.status === 'PROCESSING' ? 'Processing' : report.status === 'PENDING' ? 'Queued' : 'Failed'}
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            {(report.status === 'PENDING' || report.status === 'PROCESSING') && (
              <AIProcessingStages queued={report.status === 'PENDING'} />
            )}

            {report.status === 'FAILED' && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
                <XCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm font-medium text-destructive">Report generation failed</p>
                <p className="max-w-sm text-xs text-muted-foreground">{report.failureReason ?? 'An unknown error occurred.'}</p>
              </div>
            )}

            {report.status === 'COMPLETED' && (
              <>
                <p className="text-sm leading-relaxed">{report.summary}</p>

                <div className="grid grid-cols-3 gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Time lost
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-semibold">{formatMinutes(report.totalMinutesLost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg friction</p>
                    <p className="mt-0.5 font-mono text-lg font-semibold">{report.avgFrictionScore?.toFixed(1) ?? '—'}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingDown className="h-3 w-3" /> Burnout risk
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-semibold">
                      {report.burnoutRiskScore !== null ? `${Math.round(report.burnoutRiskScore * 100)}%` : '—'}
                    </p>
                  </div>
                </div>

                {!!report.topCategories?.length && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Top categories</p>
                    <div className="flex flex-wrap gap-2">
                      {report.topCategories.map((c, i) => (
                        <motion.div
                          key={c.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                        >
                          <Badge variant="outline" className="transition-all hover:border-primary/40">
                            {c.name} — {formatMinutes(c.minutesLost)}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {report.recommendations.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" /> AI recommendations
                    </p>
                    <div className="space-y-2">
                      {report.recommendations.map((rec, i) => (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="rounded-xl border border-border/60 bg-background/50 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                        >
                          <p className="text-sm font-medium">{rec.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rec.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}