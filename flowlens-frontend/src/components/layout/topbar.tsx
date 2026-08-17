import { useQuery } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { notificationsApi } from '@/api/notifications.api';
import { initials } from '@/lib/utils';

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list(true),
    refetchInterval: 60_000, // simple poll — no websocket layer exists on the backend yet
  });

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">FlowLens workspace</p><h1 className="mt-1 font-display text-xl font-semibold tracking-tight">{title}</h1></div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/notifications"
          className="relative rounded-full border border-border/70 bg-card/60 p-2.5 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus-ring"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {!!unread?.length && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary"
            />
          )}
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 p-1.5 text-sm transition-colors hover:bg-accent focus-ring">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-xs font-semibold text-secondary shadow-sm">
              {user ? initials(user.displayName) : '—'}
            </div>
            <span className="hidden text-sm font-medium sm:inline">{user?.displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[210px] rounded-2xl border border-border bg-card p-1.5 shadow-lg"
            >
              <DropdownMenu.Item asChild>
                <Link to="/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors hover:bg-accent">
                  <User className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link to="/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors hover:bg-accent">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={() => logout()}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}