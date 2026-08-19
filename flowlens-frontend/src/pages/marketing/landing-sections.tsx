import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, TrendingDown, Clock, Users, Zap, TriangleAlert as AlertTriangle, Lightbulb as LightbulO } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FrictionGauge } from '@/components/friction-gauge';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { RevealOnScroll, StaggerContainer, StaggerItem, Magnetic } from '@/lib/motion';

// ---------------------------------------------------------------------------
// SECTION 1 — THE PROBLEM. Friction moments accumulate as an editorial
// timeline rather than a grid of generic cards.
// ---------------------------------------------------------------------------

const MOMENTS = [
  { time: '9:42 AM', label: 'Hesitation on signup form', icon: Clock, tone: 'rust' },
  { time: '10:17 AM', label: '37% drop-off at checkout', icon: TrendingDown, tone: 'rust' },
  { time: '10:31 AM', label: 'Mobile users 2x more hesitation', icon: Users, tone: 'neutral' },
  { time: '11:05 AM', label: 'Friction increased 18% this week', icon: AlertTriangle, tone: 'rust' },
] as const;

const TONE: Record<string, string> = {
  rust: 'bg-rust text-rust-foreground',
  neutral: 'bg-muted text-muted-foreground',
  teal: 'bg-secondary text-secondary-foreground',
};

export function ProblemSection() {
  return (
    <section id="product" className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-28">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">The problem</p>
          <h2 className="mt-4 text-balance font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
            Users get stuck. You rarely see where.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            A single drop-off is invisible. Forty of them across your funnel is a pattern —
            and no standard analytics dashboard ever shows you the hesitation, the friction,
            or the journey stage that's actually losing users.
          </p>
        </RevealOnScroll>

        {/* Accumulating moments */}
        <StaggerContainer viewport className="relative flex flex-col gap-3 pl-6">
          {/* Timeline spine */}
          <motion.span
            aria-hidden
            className="absolute left-1 top-2 w-px origin-top bg-border"
            style={{ bottom: '0.5rem' }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          {MOMENTS.map((m) => (
            <StaggerItem key={m.label}>
              <div className="group relative flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                <span className={`absolute -left-[1.4rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${m.tone === 'rust' ? 'bg-primary' : 'bg-muted-foreground'} ring-4 ring-card`} />
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE[m.tone]}`}>
                  <m.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{m.time}</p>
                  <p className="font-medium">{m.label}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
          <StaggerItem>
            <div className="mt-2 flex items-baseline gap-3 pl-1">
              <AnimatedNumber value={42} suffix="/100" className="font-display text-4xl font-bold text-primary" />
              <span className="text-sm text-muted-foreground">friction score this week</span>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 2 — HOW FLOWLENS WORKS. Four stages linked by an animated flow line.
// ---------------------------------------------------------------------------

const STEPS = [
  { number: '01', title: 'Capture', description: 'Behavioral signals collected across every touchpoint of the user journey.', tone: 'teal' },
  { number: '02', title: 'Analyze', description: 'AI processes session data to identify hesitation, friction, and drop-off patterns.', tone: 'neutral' },
  { number: '03', title: 'Detect', description: 'Friction points, problem stages, and conversion blockers surfaced automatically.', tone: 'rust' },
  { number: '04', title: 'Improve', description: 'Clear, prioritized recommendations on what to fix first for maximum impact.', tone: 'teal' },
] as const;

const STEP_TONE: Record<string, string> = {
  teal: 'text-secondary-foreground bg-secondary',
  rust: 'text-primary-foreground bg-primary',
  neutral: 'text-foreground bg-muted',
};

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <RevealOnScroll className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">How it works</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">From behavioral signal to clear action</h2>
      </RevealOnScroll>

      <div className="relative mt-16">
        {/* Connecting line (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-7 hidden lg:block">
          <div className="relative mx-[10%] h-px bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 bg-secondary"
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        <StaggerContainer viewport className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StaggerItem key={step.number}>
              <div className="relative">
                <span className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl font-display text-lg font-bold ${STEP_TONE[step.tone]}`}>
                  {step.number}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 3 — FRICTION GAUGE as a premium instrument.
// ---------------------------------------------------------------------------

export function FrictionGaugeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });

  return (
    <section className="border-y border-border bg-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">The friction score</p>
          <h2 className="mt-4 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            FlowLens turns behavioral signals into a measurable friction score
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Every session, hesitation, and drop-off feeds a single, honest read on the state
            of your user journey — weighted by severity, frequency and impact.
          </p>
          <div className="mt-8 grid max-w-sm grid-cols-3 gap-4">
            {[
              { label: 'Severity', tone: 'bg-primary' },
              { label: 'Frequency', tone: 'bg-secondary' },
              { label: 'Impact', tone: 'bg-muted-foreground' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-border bg-card p-3">
                <span className={`mb-2 block h-1.5 w-8 rounded-full ${f.tone}`} />
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div ref={ref} className="flex justify-center">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-border bg-card p-10 shadow-[var(--shadow-lg)]">
            <div className="pointer-events-none absolute inset-x-10 top-6 flex justify-between text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
            <div className="flex flex-col items-center pt-4">
              {inView ? <FrictionGauge score={42} size="lg" /> : <FrictionGauge score={null} size="lg" />}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Medium friction detected — checkout hesitation trending up 18%.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 4 — USER JOURNEY ANALYTICS. A visual representation of smooth
// flow → hesitation → friction → drop-off.
// ---------------------------------------------------------------------------

const JOURNEY_STAGES = [
  { label: 'Visitor', pct: 100, tone: 'bg-secondary', status: 'smooth' },
  { label: 'Landing Page', pct: 78, tone: 'bg-secondary', status: 'smooth' },
  { label: 'Product View', pct: 61, tone: 'bg-muted-foreground', status: 'hesitation' },
  { label: 'Signup', pct: 44, tone: 'bg-primary', status: 'friction' },
  { label: 'Checkout', pct: 28, tone: 'bg-primary', status: 'friction' },
  { label: 'Conversion', pct: 22, tone: 'bg-secondary', status: 'drop-off' },
] as const;

export function JourneyAnalyticsSection() {
  return (
    <section id="insights" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <RevealOnScroll className="mx-auto mb-14 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">User journey analytics</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">See the journey, not just the numbers</h2>
        <p className="mt-3 text-muted-foreground">Every stage visualized — from smooth flow to hesitation to friction to drop-off.</p>
      </RevealOnScroll>

      <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8">
        {/* Stage flow */}
        <div className="space-y-4">
          {JOURNEY_STAGES.map((stage, i) => (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4"
            >
              <div className="w-28 shrink-0 text-right">
                <p className="text-sm font-medium">{stage.label}</p>
              </div>
              <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-muted">
                <motion.div
                  className={`h-full rounded-lg ${stage.tone}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stage.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                />
                {stage.status === 'friction' && (
                  <motion.div
                    className="absolute top-0 right-0 flex h-full items-center pr-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <AlertTriangle className="h-4 w-4 text-card" />
                  </motion.div>
                )}
              </div>
              <div className="w-16 shrink-0 text-right">
                <p className="font-mono text-sm font-semibold">{stage.pct}%</p>
                <p className={`text-[10px] uppercase ${stage.status === 'friction' ? 'text-primary' : stage.status === 'smooth' ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {stage.status}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
          {[
            { label: 'Drop-off Rate', value: 78, suffix: '%', tone: 'text-primary' },
            { label: 'Conversion Rate', value: 22, suffix: '%', tone: 'text-secondary' },
            { label: 'Friction Points', value: 2, tone: 'text-foreground' },
            { label: 'Smooth Stages', value: 3, tone: 'text-secondary' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            >
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className={`font-mono text-lg font-bold ${s.tone}`}>
                <AnimatedNumber value={s.value} suffix={s.suffix ?? ''} />
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 5 — AI INSIGHTS as premium insight cards.
// ---------------------------------------------------------------------------

const INSIGHTS = [
  {
    title: 'Users hesitate here',
    detail: 'Signup form sees 3.2s average hesitation time — 2x the platform average.',
    icon: Clock,
    tone: 'rust',
    metric: '3.2s',
    metricLabel: 'avg hesitation',
  },
  {
    title: '37% drop-off detected',
    detail: 'Checkout step 2 loses over a third of users before payment entry.',
    icon: TrendingDown,
    tone: 'rust',
    metric: '37%',
    metricLabel: 'drop-off rate',
  },
  {
    title: 'Checkout friction increased 18%',
    detail: 'Compared to last week — new payment form field is the likely cause.',
    icon: AlertTriangle,
    tone: 'rust',
    metric: '+18%',
    metricLabel: 'week over week',
  },
  {
    title: 'Mobile users experience higher hesitation',
    detail: 'Mobile sessions show 2.1x more friction than desktop on the signup flow.',
    icon: Users,
    tone: 'neutral',
    metric: '2.1x',
    metricLabel: 'mobile vs desktop',
  },
] as const;

const INSIGHT_TONE: Record<string, string> = {
  rust: 'bg-primary text-primary-foreground',
  neutral: 'bg-muted text-muted-foreground',
  teal: 'bg-secondary text-secondary-foreground',
};

export function AIInsightsSection() {
  return (
    <section className="border-y border-border bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <RevealOnScroll className="mx-auto mb-14 max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">AI insights</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Plain-language insights, not just charts</h2>
          <p className="mt-3 text-muted-foreground">FlowLens tells you what's happening, why it matters, and what to do about it.</p>
        </RevealOnScroll>

        <StaggerContainer viewport className="grid gap-5 sm:grid-cols-2">
          {INSIGHTS.map((insight) => (
            <StaggerItem key={insight.title}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${INSIGHT_TONE[insight.tone]}`}>
                        <insight.icon className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI detected</span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{insight.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-2xl font-bold ${insight.tone === 'rust' ? 'text-primary' : 'text-foreground'}`}>
                      {insight.metric}
                    </p>
                    <p className="text-[10px] uppercase text-muted-foreground">{insight.metricLabel}</p>
                  </div>
                </div>
                {/* Subtle data viz bar */}
                <div className="mt-5 flex h-1 gap-1">
                  {Array.from({ length: 12 }).map((_, j) => (
                    <motion.div
                      key={j}
                      className={`flex-1 rounded-full ${insight.tone === 'rust' ? 'bg-primary' : 'bg-muted-foreground'} opacity-${j < 8 ? '100' : '20'}`}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 + j * 0.03 }}
                      style={{ opacity: j < 8 ? 1 : 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 6 — DASHBOARD PREVIEW with scroll-based perspective.
// ---------------------------------------------------------------------------

export function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 14, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, 0]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24" ref={ref}>
      <RevealOnScroll className="mx-auto mb-14 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">The dashboard</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything in one calm view</h2>
      </RevealOnScroll>

      <div className="mx-auto max-w-4xl [perspective:1600px]">
        <motion.div
          style={{ rotateX, y, transformOrigin: 'center top' }}
          className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--shadow-xl)]"
        >
          {/* window chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="h-3 w-3 rounded-full bg-warning" />
            <span className="h-3 w-3 rounded-full bg-secondary" />
            <span className="ml-3 text-xs font-medium text-muted-foreground">FlowLens · Dashboard</span>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted p-5 sm:col-span-1">
              <FrictionGauge score={42} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              {[
                { label: 'User Sessions', value: 1284, tone: 'bg-secondary' },
                { label: 'Drop-off Rate', value: 37, suffix: '%', tone: 'bg-primary' },
                { label: 'Conversion Rate', value: 22, suffix: '%', tone: 'bg-secondary' },
                { label: 'Friction Hotspots', value: 6, tone: 'bg-primary' },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-border bg-muted p-4">
                  <span className={`mb-3 block h-1.5 w-8 rounded-full ${m.tone}`} />
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <AnimatedNumber value={m.value} suffix={m.suffix ?? ''} className="font-mono text-xl font-bold" />
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 pb-6">
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Friction Hotspots by Journey Stage</p>
              <div className="space-y-2.5">
                {[
                  { name: 'Signup', pct: 82, tone: 'bg-primary' },
                  { name: 'Checkout', pct: 67, tone: 'bg-primary' },
                  { name: 'Product View', pct: 31, tone: 'bg-muted-foreground' },
                  { name: 'Landing', pct: 12, tone: 'bg-secondary' },
                ].map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-24 text-xs">{c.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                      <motion.span
                        className={`block h-full rounded-full ${c.tone}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs font-semibold">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 7 — FEATURES. Premium feature sections with tiny animated data viz.
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    title: 'User Journey Analysis',
    description: 'Track every stage from visitor to conversion. See exactly where users flow smoothly and where they hesitate.',
    icon: ArrowRight,
    tone: 'teal',
    viz: 'path',
  },
  {
    title: 'Friction Detection',
    description: 'AI automatically identifies friction points — hesitation, repeated actions, and dead-ends in the journey.',
    icon: AlertTriangle,
    tone: 'rust',
    viz: 'pulse',
  },
  {
    title: 'AI Insights',
    description: 'Get plain-language recommendations. Not just data — actionable advice on what to fix first.',
    icon: LightbulO,
    tone: 'teal',
    viz: 'bars',
  },
  {
    title: 'Session Behavior',
    description: 'Understand how users interact with your product. Every click, scroll, and hesitation captured.',
    icon: Users,
    tone: 'neutral',
    viz: 'wave',
  },
  {
    title: 'Drop-off Analysis',
    description: 'See exactly where users leave. Quantify the cost of every friction point in your funnel.',
    icon: TrendingDown,
    tone: 'rust',
    viz: 'decline',
  },
  {
    title: 'Conversion Optimization',
    description: 'Prioritize fixes by impact. FlowLens tells you which changes will move the needle most.',
    icon: Zap,
    tone: 'teal',
    viz: 'up',
  },
] as const;

const FEATURE_TONE: Record<string, string> = {
  teal: 'bg-secondary text-secondary-foreground',
  rust: 'bg-primary text-primary-foreground',
  neutral: 'bg-muted text-muted-foreground',
};

function FeatureViz({ type, tone }: { type: string; tone: string }) {
  const color = tone === 'rust' ? 'bg-primary' : tone === 'teal' ? 'bg-secondary' : 'bg-muted-foreground';

  if (type === 'path') {
    return (
      <div className="flex h-12 items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`h-2 w-2 rounded-full ${color}`}
            initial={{ opacity: 0.3 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className="flex h-12 items-center gap-2">
        <motion.div
          className={`h-8 w-8 rounded-full ${color}`}
          initial={{ scale: 1, opacity: 0.6 }}
          whileInView={{ scale: 1.2, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className={`h-8 w-8 rounded-full ${color}`}
          initial={{ scale: 1, opacity: 0.6 }}
          whileInView={{ scale: 1.2, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    );
  }

  if (type === 'bars') {
    return (
      <div className="flex h-12 items-end gap-1">
        {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
          <motion.div
            key={i}
            className={`w-3 rounded-t ${color}`}
            initial={{ height: 0 }}
            whileInView={{ height: `${h * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          />
        ))}
      </div>
    );
  }

  if (type === 'wave') {
    return (
      <div className="flex h-12 items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-1 rounded-full ${color}`}
            initial={{ height: 4 }}
            whileInView={{ height: [4, 20, 8, 16, 4] }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity }}
          />
        ))}
      </div>
    );
  }

  if (type === 'decline') {
    return (
      <div className="flex h-12 items-end gap-1">
        {[0.9, 0.75, 0.6, 0.4, 0.25, 0.15].map((h, i) => (
          <motion.div
            key={i}
            className={`w-3 rounded-t ${color}`}
            initial={{ height: 0 }}
            whileInView={{ height: `${h * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          />
        ))}
      </div>
    );
  }

  // up
  return (
    <div className="flex h-12 items-end gap-1">
      {[0.2, 0.35, 0.5, 0.7, 0.85, 1].map((h, i) => (
        <motion.div
          key={i}
          className={`w-3 rounded-t ${color}`}
          initial={{ height: 0 }}
          whileInView={{ height: `${h * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <RevealOnScroll className="mx-auto mb-14 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Features</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to find and fix friction</h2>
      </RevealOnScroll>

      <StaggerContainer viewport className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.title}>
            <div className="group flex h-full flex-col rounded-[1.25rem] border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${FEATURE_TONE[feature.tone]}`}>
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-base font-semibold">{feature.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              <div className="mt-5 border-t border-border pt-4">
                <FeatureViz type={feature.viz} tone={feature.tone} />
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 8 — AI REPORTS as an editorial document.
// ---------------------------------------------------------------------------

export function AIReportsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">AI reports</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Reports that read like advice, not a spreadsheet
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Generate a weekly or monthly report and FlowLens writes an actual summary — friction
            trends, your biggest drop-off causes, and recommendations specific to what it found.
          </p>
          <Magnetic>
            <Button className="group mt-7" asChild>
              <Link to="/register">
                Try it free <ArrowRight className="h-4 w-4 cta-arrow" />
              </Link>
            </Button>
          </Magnetic>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <article className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--shadow-lg)]">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Weekly report</p>
                <p className="font-display text-base font-semibold">Mar 4 – Mar 10</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Completed</span>
            </header>

            <div className="space-y-5 px-6 py-6">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-[15px] leading-relaxed text-foreground"
              >
                Your signup form is causing 37% of users to drop off before completing registration.
                Checkout friction increased 18% this week — the new payment field is the likely cause.
              </motion.p>

              <div className="grid grid-cols-3 gap-3 border-y border-border py-4">
                {[
                  { label: 'Friction score', value: '42', tone: 'text-primary' },
                  { label: 'Drop-off', value: '37%', tone: 'text-primary' },
                  { label: 'Conversion', value: '22%', tone: 'text-secondary' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  >
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    <p className={`font-mono text-sm font-semibold ${s.tone}`}>{s.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2">
                {['Simplify signup form — remove 2 fields', 'Revert checkout payment field change', 'Add mobile-specific signup flow'].map((rec, i) => (
                  <motion.div
                    key={rec}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.4 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5"
                  >
                    <span className="font-mono text-xs font-semibold text-secondary">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm">{rec}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </article>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 9 — FINAL CTA with subtle animated 3D flow visualization.
// ---------------------------------------------------------------------------

export function FinalCtaSection() {
  return (
    <section className="border-t border-border bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <RevealOnScroll className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Frustration → insight → improvement</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Stop guessing where users struggle.
          </h2>
          <p className="mt-5 max-w-md mx-auto text-lg leading-relaxed text-muted-foreground">
            Turn behavioral data into clear actions with FlowLens.
          </p>
          <div className="mt-8 flex justify-center">
            <Magnetic>
              <Button size="lg" className="group" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="h-4 w-4 cta-arrow" />
                </Link>
              </Button>
            </Magnetic>
          </div>
        </RevealOnScroll>

        {/* Animated flow visualization */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-3">
            {['Visitor', 'Landing', 'Product', 'Signup', 'Checkout', 'Conversion'].map((stage, i) => (
              <div key={stage} className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-medium ${
                    stage === 'Signup' || stage === 'Checkout'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {stage[0]}
                </motion.div>
                {i < 5 && (
                  <motion.div
                    className={`h-px w-8 ${stage === 'Signup' || stage === 'Checkout' ? 'bg-primary' : 'bg-secondary'}`}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 + 0.05 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
