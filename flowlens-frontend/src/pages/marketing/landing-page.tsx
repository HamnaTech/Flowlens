import { MarketingNav } from './marketing-nav';
import { MarketingFooter } from './marketing-footer';
import { HeroSection } from './hero-section';
import {
  ProblemSection,
  HowItWorksSection,
  FrictionGaugeSection,
  AIReportsSection,
  DashboardPreviewSection,
  FinalCtaSection,
} from './landing-sections';
import { PricingSection } from './pricing-section';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FrictionGaugeSection />
        <AIReportsSection />
        <DashboardPreviewSection />
        <PricingSection id="pricing" />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
