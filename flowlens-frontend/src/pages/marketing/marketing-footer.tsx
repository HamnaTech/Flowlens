import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/brand/logo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LogoIcon className="h-4 w-4" />
          <span>© {new Date().getFullYear()} FlowLens AI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/login" className="hover:text-foreground">Log in</Link>
          <Link to="/register" className="hover:text-foreground">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}
