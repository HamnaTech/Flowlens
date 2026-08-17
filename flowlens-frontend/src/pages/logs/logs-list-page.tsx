import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Search, Trash2 } from 'lucide-react';
import { frustrationLogsApi } from '@/api/frustration-logs.api';
import { categoriesApi } from '@/api/categories.api';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FrictionScoreBadge, FrictionBar } from '@/components/domain-badges';
import { EmptyState, ErrorState, LogListSkeleton } from '@/components/empty-error-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatDate, formatMinutes } from '@/lib/utils';

export function LogsListPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoriesApi.list({ pageSize: 50 }) });

  const logsQuery = useQuery({
    queryKey: ['logs', { search, categoryId, page }],
    queryFn: () =>
      frustrationLogsApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
        categoryId: categoryId || undefined,
        sortBy: 'occurredAt',
        sortOrder: 'desc',
      }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => frustrationLogsApi.remove(id),
    onSuccess: () => {
      toast.success('Log deleted.');
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Every logged moment of friction, in one place.
            {meta && meta.totalItems > 0 && <span className="ml-1.5 text-xs">{meta.totalItems} total.</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs…"
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={categoryId || 'all'}
            onValueChange={(v) => {
              setCategoryId(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categoriesQuery.data?.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link to="/logs/new">
            <Plus className="h-4 w-4" /> Log frustration
          </Link>
        </Button>
      </div>

      {logsQuery.isLoading ? (
        <LogListSkeleton rows={6} />
      ) : logsQuery.isError ? (
        <ErrorState message={getErrorMessage(logsQuery.error)} onRetry={() => logsQuery.refetch()} />
      ) : logs.length === 0 ? (
        <EmptyState
          title={search || categoryId ? 'No logs match your filters' : 'No frustration logs yet'}
          description={search || categoryId ? 'Try adjusting your search or category filter.' : 'Log your first frustration to get started.'}
          action={
            !search && !categoryId ? (
              <Button size="sm" asChild>
                <Link to="/logs/new">Log a frustration</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
            >
              <Card className="premium-card group">
                <CardContent className="flex items-center gap-4 p-4">
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: log.category?.color ?? 'hsl(var(--muted-foreground))' }}
                  />
                  <Link to={`/logs/${log.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{log.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{log.category?.name ?? 'Uncategorized'}</span>
                      <span className="text-border">·</span>
                      <span>{formatDate(log.occurredAt)}</span>
                      {log.estimatedMinutesLost && (
                        <>
                          <span className="text-border">·</span>
                          <span className="font-mono">{formatMinutes(log.estimatedMinutesLost)} lost</span>
                        </>
                      )}
                    </p>
                  </Link>
                  <FrictionBar score={log.frictionScore} className="hidden md:flex" />
                  <FrictionScoreBadge score={log.frictionScore} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setDeleteTarget(log.id)}
                    aria-label="Delete log"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.totalItems} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this log?"
        description="This log will be removed from your lists and reports. This can't be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}