import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, Clock, Pencil, Trash2 } from 'lucide-react';
import { frustrationLogsApi } from '@/api/frustration-logs.api';
import { getErrorMessage } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FrictionScoreBadge, FrictionBar } from '@/components/domain-badges';
import { ErrorState, LogListSkeleton } from '@/components/empty-error-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatDateTime, formatMinutes } from '@/lib/utils';
import { LogForm, logToFormValues, type LogFormValues } from './log-form';

function ScoreStat({ label, value, accent }: { label: string; value: number | null; accent?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${accent ?? ''}`}>{value !== null ? value.toFixed(0) : '—'}</p>
    </div>
  );
}

export function LogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const logQuery = useQuery({
    queryKey: ['logs', id],
    queryFn: () => frustrationLogsApi.get(id!),
    enabled: !!id,
    // AI analysis runs asynchronously after creation — poll briefly so the
    // score fills in without the user needing to manually refresh.
    refetchInterval: (query) => (query.state.data?.frictionScore === null ? 4000 : false),
  });

  const updateMutation = useMutation({
    mutationFn: (values: LogFormValues) => frustrationLogsApi.update(id!, values),
    onSuccess: () => {
      toast.success('Log updated.');
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setIsEditing(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => frustrationLogsApi.remove(id!),
    onSuccess: () => {
      toast.success('Log deleted.');
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      navigate('/logs');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (logQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <LogListSkeleton rows={4} />
      </div>
    );
  }

  if (logQuery.isError || !logQuery.data) {
    return <ErrorState message={getErrorMessage(logQuery.error) || 'Log not found.'} onRetry={() => logQuery.refetch()} />;
  }

  const log = logQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/logs" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to logs
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="premium-card">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>{isEditing ? 'Edit log' : 'Log details'}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Logged {formatDateTime(log.createdAt)} · Occurred {formatDateTime(log.occurredAt)}
              </p>
            </div>
            {!isEditing && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <LogForm
                defaultValues={logToFormValues(log)}
                onSubmit={(values) => updateMutation.mutate(values)}
                isSubmitting={updateMutation.isPending}
                submitLabel="Save changes"
              />
            ) : (
              <div className="space-y-5">
                <p className="text-sm leading-relaxed">{log.description}</p>

                <div className="flex flex-wrap items-center gap-2">
                  {log.category && (
                    <Badge variant="outline">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: log.category.color }} />
                      {log.category.name}
                    </Badge>
                  )}
                  {log.tags.map(({ tag }) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Friction score</p>
                    <div className="mt-1">
                      <FrictionScoreBadge score={log.frictionScore} />
                    </div>
                  </div>
                  <ScoreStat label="Severity" value={log.severityScore} />
                  <ScoreStat label="Frequency" value={log.frequencyScore} />
                  <ScoreStat label="Preventability" value={log.preventabilityScore} />
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Time lost
                    </p>
                    <p className="mt-1 text-sm font-medium">{formatMinutes(log.estimatedMinutesLost)}</p>
                  </div>
                </div>

                {log.frictionScore !== null && (
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Friction indicator</p>
                    <FrictionBar score={log.frictionScore} />
                  </div>
                )}

                {log.frictionScore === null && (
                  <p className="animate-soft-pulse text-xs text-muted-foreground">
                    AI analysis is still running — this page will update automatically.
                  </p>
                )}

                {log.attachments.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Attachments</p>
                    <div className="space-y-2">
                      {log.attachments.map((a) => (
                        <div key={a.id} className="rounded-lg border border-border p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span>{a.kind} — {a.status}</span>
                            {a.publicUrl && (
                              <a href={a.publicUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                View
                              </a>
                            )}
                          </div>
                          {a.transcript && <p className="mt-1 text-muted-foreground">"{a.transcript}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this log?"
        description="This can't be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}