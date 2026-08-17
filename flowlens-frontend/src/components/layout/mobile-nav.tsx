import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ListChecks, Tags, FileBarChart, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/logs', label: 'Logs', icon: ListChecks },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/60 bg-card/90 backdrop-blur-md md:hidden">
      {mobileNavItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function MobileMenuIcon() {
  return <Menu className="h-5 w-5" />;
}