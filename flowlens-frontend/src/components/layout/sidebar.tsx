import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, ListChecks, Tags, ChartBar as FileBarChart, Building2, Bell, Settings } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/brand/logo';
import { notificationsApi } from '@/api/notifications.api';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/logs', label: 'Frustration Logs', icon: ListChecks },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/reports', label: 'AI Reports', icon: FileBarChart },
];

const workspaceNav = [{ to: '/organizations', label: 'Organizations', icon: Building2 }];

const systemNav = [
  { to: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavGroup({ label, items }: { label?: string; items: typeof mainNav | typeof systemNav }) {
  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list(true),
    refetchInterval: 60_000,
    enabled: items.some((i) => 'showBadge' in i && i.showBadge),
  });

  return (
    <div className="space-y-1">
      {label && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>}
      {items.map(({ to, label: itemLabel, icon: Icon, ...rest }) => {
        const showBadge = 'showBadge' in rest && rest.showBadge && !!unread?.length;
        return (
          <NavLink key={to} to={to} className="relative block">
            {({ isActive }) => (
              <div
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon className={cn('h-4 w-4 transition-transform duration-200', isActive && 'scale-110')} />
                  {showBadge && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </span>
                <span className="relative z-10">{itemLabel}</span>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/80 bg-card/45 backdrop-blur-sm md:flex">
      <div className="flex h-20 items-center border-b border-border/70 px-6">
        <Logo iconClassName="h-7 w-7" textClassName="text-base" />
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        <NavGroup items={mainNav} />
        <NavGroup label="Workspace" items={workspaceNav} />
        <NavGroup label="System" items={systemNav} />
      </nav>

      <div className="border-t border-border/70 p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent/60">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-xs font-semibold text-secondary shadow-sm">
            {user ? initials(user.displayName) : '—'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}