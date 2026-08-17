import { MarketingNav } from './marketing-nav';
import { MarketingFooter } from './marketing-footer';
import { PricingSection } from './pricing-section';
import { RevealOnScroll } from '@/lib/motion';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="px-4 pt-16 text-center sm:px-6">
        <RevealOnScroll>
          <h1 className="font-display text-4xl font-bold tracking-tight">Pricing</h1>
          <p className="mt-3 text-muted-foreground">Straightforward plans. Upgrade only when Free stops being enough.</p>
        </RevealOnScroll>
      </div>
      <PricingSection />
      <MarketingFooter />
    </div>
  );
}
