import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RevealOnScroll, StaggerContainer, StaggerItem } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Tier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  /** Whether this tier can actually be started right now (Free = real registration; paid tiers have no billing backend yet). */
  live: boolean;
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'For getting a real read on where your time actually goes.',
    features: ['Up to 30 frustration logs/month', 'Core dashboard', 'Basic category breakdown', '1 AI report per month'],
    cta: 'Start free',
    live: true,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For anyone who wants the AI actually working for them.',
    features: [
      'Unlimited frustration logs',
      'Unlimited AI reports',
      'Advanced friction analytics',
      'Priority AI processing',
      'Full historical trends',
    ],
    cta: 'Notify me at launch',
    highlighted: true,
    live: false,
  },
  {
    name: 'Business',
    price: 'Custom',
    description: 'For teams who need to see friction across the whole org.',
    features: [
      'Everything in Pro',
      'Organizations & teams',
      'Team-wide analytics',
      'Role-based access control',
      'Dedicated onboarding',
    ],
    cta: 'Contact sales',
    live: false,
  },
];

export function PricingSection({ id }: { id?: string }) {
  const navigate = useNavigate();

  function handleCta(tier: Tier) {
    if (tier.live) {
      navigate('/register');
      return;
    }
    // Honest UI: no Stripe/billing integration exists yet, so this never
    // pretends a purchase happened. It captures interest and sends people
    // to the one thing that IS real — creating a free account.
    toast.info(`${tier.name} billing isn't live yet — we'll email you the moment it is.`);
    navigate('/register');
  }

  return (
    <section id={id} className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when the insight is worth it.</p>
      </RevealOnScroll>

      <StaggerContainer viewport className="mt-12 grid gap-6 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <StaggerItem key={tier.name}>
            <div
              className={cn(
                'relative flex h-full flex-col overflow-hidden rounded-[1.25rem] p-6 transition-all duration-300 hover:-translate-y-1',
                tier.highlighted
                  ? 'border-2 border-coral bg-card shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)]'
                  : 'border border-border bg-card hover:border-coral/40 hover:shadow-[var(--shadow-md)]',
              )}
            >
              {tier.highlighted && (
                <>
                  <span className="absolute inset-x-0 top-0 h-1.5 bg-coral" />
                  <span className="absolute right-4 top-4 rounded-full bg-coral px-3 py-1 text-xs font-semibold text-coral-foreground">
                    Most popular
                  </span>
                </>
              )}
              <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={tier.highlighted ? 'default' : 'outline'}
                onClick={() => handleCta(tier)}
              >
                {tier.cta}
              </Button>
              {!tier.live && <p className="mt-2 text-center text-[11px] text-muted-foreground">Billing not yet available</p>}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
