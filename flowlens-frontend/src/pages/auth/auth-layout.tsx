import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { RevealOnScroll } from '@/lib/motion';

const marks = [
  'Silent friction, surfaced',
  'Reports your team will read',
  'One score to align on',
];

/**
 * Two-panel editorial auth shell. Left: the form. Right: a quiet brand panel
 * that restates the product promise on a solid butter field — no gradients,
 * no glow, just typographic calm.
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* Form column */}
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <Link to="/" className="inline-flex w-fit items-center" aria-label="FlowLens home">
          <Logo />
        </Link>

        <div className="flex flex-1 items-center py-10">
          <RevealOnScroll className="w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
          </RevealOnScroll>
        </div>
      </div>

      {/* Brand column */}
      <aside className="relative hidden overflow-hidden bg-butter lg:block">
        <div className="flex h-full flex-col justify-between p-14">
          <div className="flex items-center gap-2 text-butter-foreground">
            <span className="h-2 w-2 rounded-full bg-coral" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">FlowLens</span>
          </div>

          <div className="max-w-md">
            <p className="font-display text-4xl font-semibold leading-[1.15] tracking-tight text-butter-foreground text-balance">
              Turn scattered feedback into a workflow you can actually fix.
            </p>
            <ul className="mt-10 space-y-4">
              {marks.map((m) => (
                <li key={m} className="flex items-center gap-3 text-butter-foreground/80">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral text-coral-foreground">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quiet decorative instrument — a single friction dial, load-bearing to the brand story */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold text-butter-foreground">32</span>
              <span className="text-sm text-butter-foreground/70">avg. friction score</span>
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              {[10, 18, 14, 22, 16, 26, 20].map((h, i) => (
                <span key={i} className="w-2 rounded-full bg-coral/70" style={{ height: h }} />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
