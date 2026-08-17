import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReportStatus } from '@/types/api';

/**
 * Friction score color coding: low (calm/teal) -> high (rust/red), matching
 * the app's own friction=heat visual language rather than an arbitrary
 * green-yellow-red traffic light.
 */
export function frictionTier(score: number): 'high' | 'medium' | 'low' {
  return score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
}

export function FrictionScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <Badge variant="outline">Pending</Badge>;
  }
  const tier = frictionTier(score);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono',
        tier === 'high' && 'bg-destructive/15 text-destructive',
        tier === 'medium' && 'bg-warning/20 text-warning',
        tier === 'low' && 'bg-success/15 text-success',
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}

/** Visual friction indicator bar (e.g. ██████░░░░ 34.8) */
export function FrictionBar({ score, className }: { score: number | null | undefined; className?: string }) {
  if (score === null || score === undefined) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="h-2 w-1.5 rounded-sm bg-muted" />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">Pending</span>
      </div>
    );
  }
  const tier = frictionTier(score);
  const filled = Math.round(score / 10);
  const color = tier === 'high' ? 'bg-destructive' : tier === 'medium' ? 'bg-warning' : 'bg-success';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-0.5" aria-label={`Friction score ${score.toFixed(1)} out of 100`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={cn('h-2 w-1.5 rounded-sm', i < filled ? color : 'bg-muted')} />
        ))}
      </div>
      <span className="font-mono text-xs font-semibold">{score.toFixed(1)}</span>
    </div>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'PROCESSING':
      return (
        <Badge variant="warning" className="animate-soft-pulse">
          Processing
        </Badge>
      );
    case 'PENDING':
      return <Badge variant="outline">Queued</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
  }
}