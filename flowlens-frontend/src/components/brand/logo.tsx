import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The FlowLens mark: a single stroke that reads left-to-right as the
 * product's core idea made visual — it starts jagged and sharp (friction)
 * and resolves into a smooth continuous curve (flow). Not a brain, not a
 * checkmark, not a generic abstract blob — the shape itself is the concept.
 */
function LogoMark({ className }: { className?: string }) {
  // useId (not a hardcoded string) — this component renders multiple times
  // per page at once (sidebar + mobile nav + topbar can all be mounted
  // simultaneously across breakpoints), and SVG gradient IDs must be
  // unique in the DOM or later instances silently lose their gradient.
  const gradientId = `fl-grad-${useId()}`;
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="2" y1="26" x2="30" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--secondary))" />
        </linearGradient>
      </defs>
      <path
        d="M4 25 L10 9 L14 19.5 L17.5 13 C21 8.5 25 6.5 29 5.5"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="miter"
        fill="none"
      />
      {/* Endpoint node — where "flow" resolves, echoed in the Friction Gauge's needle hub */}
      <circle cx="29" cy="5.5" r="2.25" fill="hsl(var(--secondary))" />
    </svg>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return <LogoMark className={cn('h-6 w-6', className)} />;
}

export function Logo({ className, iconClassName, textClassName }: { className?: string; iconClassName?: string; textClassName?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark className={cn('h-6 w-6 shrink-0', iconClassName)} />
      <span className={cn('font-display text-lg font-semibold tracking-tight', textClassName)}>FlowLens</span>
    </div>
  );
}
