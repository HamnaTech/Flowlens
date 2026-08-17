import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Topbar } from './topbar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/logs': 'Frustration Logs',
  '/categories': 'Categories',
  '/reports': 'AI Reports',
  '/organizations': 'Organizations',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

function titleFor(pathname: string): string {
  const match = Object.keys(pageTitles).find((key) => pathname.startsWith(key));
  return match ? pageTitles[match] : 'FlowLens AI';
}

export function AppShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={titleFor(location.pathname)} />
        <main className="flex-1 px-4 pb-20 pt-5 md:px-6 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}