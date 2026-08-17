import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Gauge, Repeat2, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardData } from './use-dashboard-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FrictionScoreBadge, ReportStatusBadge, FrictionBar } from '@/components/domain-badges';
import { FrictionGauge } from '@/components/friction-gauge';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { EmptyState, ErrorState, MetricCardSkeleton, LogListSkeleton, ReportSkeleton } from '@/components/empty-error-states';
import { formatMinutes, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function TrendIcon({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <Minus className="h-3 w-3" />;
  if (value > 0) return <TrendingUp className="h-3 w-3 text-destructive" />;
  return <TrendingDown className="h-3 w-3 text-success" />;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  numeric,
  decimals = 0,
  suffix = '',
  caption,
  trend,
  accent,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  numeric?: number;
  decimals?: number;
  suffix?: string;
  caption?: string;
  trend?: number | null;
  accent: 'primary' | 'secondary' | 'warning' | 'success';
  delay?: number;
}) {
  const accentClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    warning: 'bg-warning/15 text-warning-foreground',
    success: 'bg-success/10 text-success',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="premium-card rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-3xl font-bold tracking-tight">
            {numeric !== undefined ? <AnimatedNumber value={numeric} decimals={decimals} suffix={suffix} /> : value}
          </div>
          {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs font-medium">
            <TrendIcon value={trend} />
            <span className={trend && trend > 0 ? 'text-destructive' : 'text-success'}>
              {trend !== null && trend !== undefined ? `${Math.abs(trend)} this week` : ''}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { isLoading, isError, recentLogs, stats, categoryBreakdown, recentReports, refetch } = useDashboardData();
  const { user } = useAuth();

  if (isError) {
    return <ErrorState message="Couldn't load your dashboard data." onRetry={refetch} />;
  }

  // Build chart data from actual logs (friction over time)
  const chartData = recentLogs
    .filter((l) => l.frictionScore !== null)
    .slice()
    .reverse()
    .map((l) => ({
      date: formatDate(l.occurredAt),
      friction: l.frictionScore,
      timeLost: l.estimatedMinutesLost ?? 0,
    }));

  const hasChartData = chartData.length >= 2;

  return (
    <div className="space-y-6">
      {/* Hero / Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-butter p-6 shadow-sm md:p-8"
      >
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          {/* Greeting + gauge */}
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-butter-foreground">
                {greeting()}, <span className="text-primary">{user?.displayName?.split(' ')[0] ?? 'there'}</span>
              </h2>
              <p className="mt-1 text-sm text-butter-foreground/70">
                {stats.avgFrictionScore === null
                  ? 'Log your first frustration to start uncovering patterns.'
                  : stats.avgFrictionScore >= 70
                    ? 'Your workflow has experienced high friction this week.'
                    : stats.avgFrictionScore >= 40
                      ? 'Your workflow has experienced moderate friction this week.'
                      : 'Your workflow is flowing smoothly this week.'}
              </p>
            </div>
            <div className="shrink-0">
              <FrictionGauge score={stats.avgFrictionScore} size="md" />
            </div>
          </div>

          {/* Key insights */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time lost</p>
              <p className="mt-1 font-mono text-2xl font-bold">{formatMinutes(stats.totalMinutesLost)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">across {stats.sampleSize} logged frustrations</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preventability</p>
              <p className="mt-1 font-mono text-2xl font-bold">
                {stats.avgPreventability !== null ? `${stats.avgPreventability.toFixed(0)}%` : '—'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stats.avgPreventability !== null
                  ? stats.avgPreventability >= 60
                    ? 'Mostly preventable'
                    : stats.avgPreventability >= 30
                      ? 'Partially preventable'
                      : 'Hard to prevent'
                  : 'No data yet'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top category</p>
              <p className="mt-1 truncate text-lg font-semibold">
                {categoryBreakdown[0]?.name ?? '—'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {categoryBreakdown[0] ? `${categoryBreakdown[0].count} logs` : 'No categories yet'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI reports</p>
              <p className="mt-1 font-mono text-2xl font-bold">{recentReports.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">recently generated</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Gauge}
            label="Total logs"
            value={String(stats.totalLogs)}
            numeric={stats.totalLogs}
            caption={`${stats.sampleSize} in current sample`}
            accent="primary"
            delay={0}
          />
          <MetricCard
            icon={ShieldAlert}
            label="Avg friction score"
            value={stats.avgFrictionScore !== null ? stats.avgFrictionScore.toFixed(1) : '—'}
            numeric={stats.avgFrictionScore ?? undefined}
            decimals={1}
            caption={stats.sampleSize ? `Based on ${stats.sampleSize} scored logs` : undefined}
            accent="warning"
            delay={0.05}
          />
          <MetricCard
            icon={Clock}
            label="Time lost"
            value={formatMinutes(stats.totalMinutesLost)}
            caption="Recent logs total"
            accent="secondary"
            delay={0.1}
          />
          <MetricCard
            icon={Repeat2}
            label="Avg preventability"
            value={stats.avgPreventability !== null ? `${stats.avgPreventability.toFixed(0)}%` : '—'}
            numeric={stats.avgPreventability ?? undefined}
            suffix="%"
            caption={stats.avgPreventability !== null ? 'of friction is preventable' : undefined}
            accent="success"
            delay={0.15}
          />
        </div>
      )}

      {/* Charts + Recent logs */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Friction trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Friction over time</CardTitle>
            {hasChartData && (
              <span className="text-xs text-muted-foreground">Last {chartData.length} logs</span>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48">
                <MetricCardSkeleton />
              </div>
            ) : !hasChartData ? (
              <EmptyState
                title="Not enough data yet"
                description="Log at least 2 frustrations with friction scores to see the trend."
                action={
                  <Button size="sm" asChild>
                    <Link to="/logs/new">Log a frustration</Link>
                  </Button>
                }
              />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="frictionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="friction"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#frictionGradient)"
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LogListSkeleton rows={4} />
            ) : categoryBreakdown.length === 0 ? (
              <EmptyState title="No categorized logs yet" />
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 truncate text-sm">{cat.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{cat.count}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent logs */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Recent frustration logs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/logs">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LogListSkeleton rows={4} />
          ) : recentLogs.length === 0 ? (
            <EmptyState
              title="No frustration logs yet"
              description="Start capturing moments of friction to uncover patterns in your workflow."
              action={
                <Button size="sm" asChild>
                  <Link to="/logs/new">Log a frustration</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {recentLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Link
                    to={`/logs/${log.id}`}
                    className="group flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-accent/50 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{log.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {log.category?.name ?? 'Uncategorized'} · {formatDate(log.occurredAt)}
                        {log.estimatedMinutesLost ? ` · ${formatMinutes(log.estimatedMinutesLost)} lost` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <FrictionBar score={log.frictionScore} className="hidden sm:flex" />
                      <FrictionScoreBadge score={log.frictionScore} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent AI reports */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Recent AI reports
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reports">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ReportSkeleton rows={2} />
          ) : recentReports.length === 0 ? (
            <EmptyState
              title="No AI reports yet"
              description="Generate a report to get a summarized breakdown and recommendations."
              action={
                <Button size="sm" asChild>
                  <Link to="/reports">Generate a report</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentReports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Link
                    to={`/reports/${report.id}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary">
                        {report.period.charAt(0) + report.period.slice(1).toLowerCase()} report — {formatDate(report.periodStart)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {report.summary ?? (report.status === 'FAILED' ? report.failureReason ?? 'Generation failed.' : 'Still processing…')}
                      </p>
                    </div>
                    <ReportStatusBadge status={report.status} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
