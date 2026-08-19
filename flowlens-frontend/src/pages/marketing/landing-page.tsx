import { MarketingNav } from './marketing-nav';
import { MarketingFooter } from './marketing-footer';
import { HeroSection } from './hero-section';
import {
  ProblemSection,
  HowItWorksSection,
  FrictionGaugeSection,
  JourneyAnalyticsSection,
  AIInsightsSection,
  DashboardPreviewSection,
  FeaturesSection,
  JourneyAnalyticsSection,
  AIInsightsSection,
  FinalCtaSection,
  FeaturesSection,
  AIReportsSection,
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
        <JourneyAnalyticsSection />
        <AIInsightsSection />
        <DashboardPreviewSection />
        <FeaturesSection />
        <JourneyAnalyticsSection />
        <AIInsightsSection />
        <PricingSection id="pricing" />
        <FeaturesSection />
        <AIReportsSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
