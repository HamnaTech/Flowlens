import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Sparkles, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { reportsApi, type CreateReportInput } from '@/api/reports.api';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmptyState, ErrorState, ReportSkeleton } from '@/components/empty-error-states';
import { formatDateTime } from '@/lib/utils';
import type { ReportPeriod } from '@/types/api';

function GenerateReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<CreateReportInput>({ defaultValues: { period: 'WEEKLY' } });

  const mutation = useMutation({
    mutationFn: (values: CreateReportInput) => reportsApi.create(values),
    onSuccess: () => {
      toast.success('Report queued — AI analysis runs in the background.');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate a report
          </DialogTitle>
          <DialogDescription>Summarizes your logged frustrations for the selected period using AI.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Controller
            control={control}
            name="period"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as ReportPeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Queuing…' : 'Generate report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'PROCESSING':
      return <Loader2 className="h-4 w-4 animate-spin text-warning" />;
    case 'PENDING':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
}

export function ReportsListPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const reportsQuery = useQuery({ queryKey: ['reports'], queryFn: () => reportsApi.list({ pageSize: 20 }) });
  const reports = reportsQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">AI-generated summaries of your logged frustrations.</p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Generate report
        </Button>
      </div>

      {reportsQuery.isLoading ? (
        <ReportSkeleton rows={4} />
      ) : reportsQuery.isError ? (
        <ErrorState message={getErrorMessage(reportsQuery.error)} onRetry={() => reportsQuery.refetch()} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No reports yet"
          description="Generate your first report to get an AI-written summary and recommendations."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}>Generate report</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Link to={`/reports/${report.id}`} className="block">
                <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {report.period.charAt(0) + report.period.slice(1).toLowerCase()} report
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDateTime(report.periodStart)} – {formatDateTime(report.periodEnd)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                        <ReportStatusIcon status={report.status} />
                        <span
                          className={
                            report.status === 'COMPLETED'
                              ? 'text-success'
                              : report.status === 'PROCESSING'
                                ? 'text-warning-foreground'
                                : report.status === 'FAILED'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                          }
                        >
                          {report.status === 'COMPLETED'
                            ? 'Completed'
                            : report.status === 'PROCESSING'
                              ? 'Processing'
                              : report.status === 'PENDING'
                                ? 'Queued'
                                : 'Failed'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                      {report.summary ?? (report.status === 'FAILED' ? report.failureReason ?? 'Generation failed.' : 'AI is analyzing your logs to generate insights…')}
                    </p>

                    {report.status === 'COMPLETED' && (
                      <div className="mt-4 flex gap-6 border-t border-border/60 pt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Time lost</p>
                          <p className="font-mono text-sm font-semibold">{report.totalMinutesLost !== null ? `${report.totalMinutesLost}m` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg friction</p>
                          <p className="font-mono text-sm font-semibold">{report.avgFrictionScore?.toFixed(1) ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Recommendations</p>
                          <p className="font-mono text-sm font-semibold">{report.recommendations.length}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <GenerateReportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}