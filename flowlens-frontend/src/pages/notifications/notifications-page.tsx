import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Bell, CheckCheck, FileBarChart, Repeat2, Sparkles, UserPlus } from 'lucide-react';
import { notificationsApi } from '@/api/notifications.api';
import { getErrorMessage } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/empty-error-states';
import { cn, formatDateTime } from '@/lib/utils';
import type { NotificationType } from '@/types/api';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  WEEKLY_REPORT_READY: FileBarChart,
  BURNOUT_RISK_ALERT: AlertTriangle,
  RECURRING_PATTERN_DETECTED: Repeat2,
  TEAM_INVITE: UserPlus,
  SUBSCRIPTION_EXPIRING: AlertTriangle,
  COMMENT_MENTION: Bell,
  SYSTEM: Sparkles,
};

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Mark all unread as read using the existing per-notification API
  const markAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Use the real per-item API sequentially — respects the backend
      for (const id of ids) {
        await notificationsApi.markAsRead(id);
      }
    },
    onSuccess: () => {
      toast.success('All notifications marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (notificationsQuery.isLoading) return <ListSkeleton rows={5} />;
  if (notificationsQuery.isError) {
    return <ErrorState message={getErrorMessage(notificationsQuery.error)} onRetry={() => notificationsQuery.refetch()} />;
  }

  const notifications = notificationsQuery.data ?? [];
  const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications" description="You'll see AI report updates and alerts here." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadIds.length > 0 ? `${unreadIds.length} unread notification${unreadIds.length === 1 ? '' : 's'}` : 'All caught up'}
        </p>
        {unreadIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate(unreadIds)}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            {markAllMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {notifications.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              onClick={() => !n.readAt && markReadMutation.mutate(n.id)}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition-all duration-200 hover:bg-accent/50',
                !n.readAt && 'bg-primary/[0.03] hover:bg-primary/[0.06]',
              )}
            >
              <div
                className={cn(
                  'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  n.readAt ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                )}
              >
                {(() => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                {!n.readAt && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary shadow-glow-rust" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', n.readAt ? 'font-normal text-muted-foreground' : 'font-semibold')}>{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">{formatDateTime(n.createdAt)}</p>
              </div>
            </motion.button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}