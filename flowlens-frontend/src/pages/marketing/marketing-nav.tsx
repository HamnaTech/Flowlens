import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/lib/motion';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group relative py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-secondary transition-all duration-300 group-hover:w-full" />
    </a>
  );
}

export function MarketingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 sm:flex">
          <NavLink href="#product">Product</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how-it-works">How It Works</NavLink>
          <NavLink href="#insights">Insights</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Magnetic>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </Magnetic>
        </div>
      </div>
    </motion.header>
  );
}
