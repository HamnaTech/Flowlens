import { Link } from 'react-router-dom';
import { ArrowRight, Brain, LineChart, ListChecks, Sparkles, TrendingDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RevealOnScroll, StaggerContainer, StaggerItem } from '@/lib/motion';

const FEATURES = [
  {
    icon: Zap,
    title: 'Log friction in seconds',
    description: 'Capture what slowed you down — a meeting, a bug, a wait — before you forget it mattered.',
  },
  {
    icon: Brain,
    title: 'AI does the analysis',
    description: 'Every log is scored on severity, frequency, and preventability automatically — no manual tagging.',
  },
  {
    icon: LineChart,
    title: 'See the real pattern',
    description: "Individual annoyances look random. A month of them shows you exactly what's actually costing you time.",
  },
  {
    icon: ListChecks,
    title: 'Recommendations, not just charts',
    description: "AI reports don't just summarize — they tell you the specific thing worth fixing first.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Built to find what's actually wrong
        </h2>
        <p className="mt-3 text-muted-foreground">Not another time tracker. FlowLens finds the friction, not just the hours.</p>
      </RevealOnScroll>

      <StaggerContainer viewport className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title}>
            <div className="premium-card h-full rounded-2xl p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl ai-gradient-bg">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

const STEPS = [
  { number: '01', title: 'Log the moment', description: 'Text, in under 10 seconds — while the frustration is still fresh.' },
  { number: '02', title: 'AI scores it', description: 'Severity, frequency, and preventability are calculated automatically in the background.' },
  { number: '03', title: 'Patterns emerge', description: 'Your dashboard fills in — categories, trends, and a friction score that updates in real time.' },
  { number: '04', title: 'Get the fix', description: "AI reports turn weeks of logs into specific, prioritized recommendations." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-border/60 bg-muted/40 py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <RevealOnScroll className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How FlowLens works</h2>
        </RevealOnScroll>

        <StaggerContainer viewport className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StaggerItem key={step.number}>
              <span className="ai-gradient-text font-display text-3xl font-bold">{step.number}</span>
              <h3 className="mt-3 font-display font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

export function AIPreviewSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <RevealOnScroll>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> AI Reports
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            Reports that read like advice, not a spreadsheet
          </h2>
          <p className="mt-4 text-muted-foreground">
            Generate a weekly or monthly report and FlowLens writes an actual summary — burnout
            risk, your biggest time sinks, and 2-4 recommendations specific to what you logged.
            Not a template. Not generic advice.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/register">
              Try it free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <div className="premium-card rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Weekly report</span>
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">Completed</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              "Your standups ran over 3 of 5 days this week, costing roughly 90 minutes. Meetings
              remain your top friction category — consider a hard 15-minute timer."
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Time lost</p>
                <p className="font-mono text-sm font-semibold">4h 20m</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Burnout risk
                </p>
                <p className="font-mono text-sm font-semibold text-success">Low</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Friction score</p>
                <p className="font-mono text-sm font-semibold">34.2</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <RevealOnScroll>
        <div className="ai-gradient-bg rounded-3xl border border-primary/20 px-8 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Find out what's actually slowing you down.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Free to start. No credit card. Your first AI report is on us.
          </p>
          <Button size="lg" className="mt-7" asChild>
            <Link to="/register">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </RevealOnScroll>
    </section>
  );
}
