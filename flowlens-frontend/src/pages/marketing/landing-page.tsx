import { MarketingNav } from './marketing-nav';
import { MarketingFooter } from './marketing-footer';
import { HeroSection } from './hero-section';
import { FeaturesSection, HowItWorksSection, AIPreviewSection, FinalCtaSection } from './landing-sections';
import { PricingSection } from './pricing-section';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AIPreviewSection />
      <PricingSection id="pricing" />
      <FinalCtaSection />
      <MarketingFooter />
    </div>
  );
}
