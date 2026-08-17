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
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when the insight is worth it.</p>
      </RevealOnScroll>

      <StaggerContainer viewport className="mt-12 grid gap-6 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <StaggerItem key={tier.name}>
            <div
              className={cn(
                'relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300',
                tier.highlighted
                  ? 'border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-lg shadow-primary/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15'
                  : 'border-border bg-card hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg',
              )}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
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
