import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bell, CalendarClock, RefreshCw, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FrictionGauge } from '@/components/friction-gauge';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { RevealOnScroll, StaggerContainer, StaggerItem, Magnetic } from '@/lib/motion';
import { HeroScene } from './hero-scene';

// ---------------------------------------------------------------------------
// SECTION 2 — THE PROBLEM. Friction moments accumulate as an editorial
// timeline rather than a grid of generic cards.
// ---------------------------------------------------------------------------

const MOMENTS = [
  { time: '9:42 AM', label: 'Standup runs 22 minutes over', icon: CalendarClock, tone: 'peach' },
  { time: '10:17 AM', label: '"Quick question" in Slack', icon: Bell, tone: 'butter' },
  { time: '10:31 AM', label: 'Context switch — third this hour', icon: RefreshCw, tone: 'lavender' },
  { time: '11:05 AM', label: 'Still waiting on that approval', icon: Hourglass, tone: 'powder' },
] as const;

const TONE: Record<string, string> = {
  peach: 'bg-peach text-peach-foreground',
  butter: 'bg-butter text-butter-foreground',
  lavender: 'bg-lavender text-lavender-foreground',
  powder: 'bg-powder text-powder-foreground',
};

export function ProblemSection() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-28">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The problem</p>
          <h2 className="mt-4 text-balance font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
            None of it feels like a big deal. All of it adds up.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            A single interruption is nothing. Forty of them, five days a week, is where your time
            actually goes — and no calendar or time tracker ever shows you that.
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
                <span className="absolute -left-[1.4rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary ring-4 ring-card" />
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
              <AnimatedNumber value={6.4} decimals={1} suffix="h" className="font-display text-4xl font-bold text-primary" />
              <span className="text-sm text-muted-foreground">lost to friction this week</span>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 3 — HOW IT WORKS. Four stages linked by an animated connecting line.
// ---------------------------------------------------------------------------

const STEPS = [
  { number: '01', title: 'Log the moment', description: 'Text, in under 10 seconds — while the frustration is still fresh.', tone: 'peach' },
  { number: '02', title: 'FlowLens analyzes it', description: 'Severity, frequency and preventability, scored automatically in the background.', tone: 'sage' },
  { number: '03', title: 'Patterns emerge', description: 'Individual annoyances become categories, trends and a live friction score.', tone: 'powder' },
  { number: '04', title: 'You get the fix', description: 'Reports turn weeks of logs into a short list of what to change first.', tone: 'butter' },
] as const;

const STEP_TONE: Record<string, string> = {
  peach: 'text-peach-foreground bg-peach',
  sage: 'text-sage-foreground bg-sage',
  powder: 'text-powder-foreground bg-powder',
  butter: 'text-butter-foreground bg-butter',
};

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <RevealOnScroll className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">From a passing annoyance to a decision</h2>
      </RevealOnScroll>

      <div className="relative mt-16">
        {/* Connecting line (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-7 hidden lg:block">
          <div className="relative mx-[10%] h-px bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary"
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
// SECTION 4 — FRICTION GAUGE as a premium instrument.
// ---------------------------------------------------------------------------

export function FrictionGaugeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The friction score</p>
          <h2 className="mt-4 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            One number for how much your week is fighting you
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Every log feeds a single, honest read on the state of your workflow — weighted by
            severity, frequency and how preventable each moment really was.
          </p>
          <div className="mt-8 grid max-w-sm grid-cols-3 gap-4">
            {[
              { label: 'Severity', tone: 'bg-peach' },
              { label: 'Frequency', tone: 'bg-sage' },
              { label: 'Preventability', tone: 'bg-powder' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-border bg-background p-3">
                <span className={`mb-2 block h-1.5 w-8 rounded-full ${f.tone}`} />
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div ref={ref} className="flex justify-center">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-border bg-background p-10 shadow-[var(--shadow-lg)]">
            <div className="pointer-events-none absolute inset-x-10 top-6 flex justify-between text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
            <div className="flex flex-col items-center pt-4">
              {inView ? <FrictionGauge score={34.2} size="lg" /> : <FrictionGauge score={null} size="lg" />}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Low friction this week — meetings trending down 18%.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 5 — AI REPORTS as an editorial document.
// ---------------------------------------------------------------------------

export function AIReportsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AI reports</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Reports that read like advice, not a spreadsheet
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Generate a weekly or monthly report and FlowLens writes an actual summary — burnout
            risk, your biggest time sinks, and a few recommendations specific to what you logged.
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
              <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-sage-foreground">Completed</span>
            </header>

            <div className="space-y-5 px-6 py-6">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-[15px] leading-relaxed text-foreground"
              >
                Your standups ran over on 3 of 5 days, costing roughly 90 minutes. Meetings remain
                your top friction category — a hard 15-minute timer would likely recover most of it.
              </motion.p>

              <div className="grid grid-cols-3 gap-3 border-y border-border py-4">
                {[
                  { label: 'Time lost', value: '4h 20m', tone: 'text-foreground' },
                  { label: 'Burnout risk', value: 'Low', tone: 'text-secondary' },
                  { label: 'Friction score', value: '34.2', tone: 'text-foreground' },
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
                {['Set a 15-min standup timer', 'Batch Slack into two windows', 'Escalate the approval bottleneck'].map((rec, i) => (
                  <motion.div
                    key={rec}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.4 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5"
                  >
                    <span className="font-mono text-xs font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The dashboard</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything in one calm view</h2>
      </RevealOnScroll>

      <div className="mx-auto max-w-4xl [perspective:1600px]">
        <motion.div
          style={{ rotateX, y, transformOrigin: 'center top' }}
          className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--shadow-xl)]"
        >
          {/* window chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-peach" />
            <span className="h-3 w-3 rounded-full bg-butter" />
            <span className="h-3 w-3 rounded-full bg-sage" />
            <span className="ml-3 text-xs font-medium text-muted-foreground">FlowLens · Dashboard</span>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background p-5 sm:col-span-1">
              <FrictionGauge score={34.2} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              {[
                { label: 'Total logs', value: 42, tone: 'bg-peach' },
                { label: 'Time lost', value: 260, suffix: 'm', tone: 'bg-powder' },
                { label: 'Avg score', value: 34.2, decimals: 1, tone: 'bg-butter' },
                { label: 'Preventable', value: 61, suffix: '%', tone: 'bg-sage' },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-border bg-background p-4">
                  <span className={`mb-3 block h-1.5 w-8 rounded-full ${m.tone}`} />
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <AnimatedNumber value={m.value} decimals={m.decimals ?? 0} suffix={m.suffix ?? ''} className="font-mono text-xl font-bold" />
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 pb-6">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Top categories</p>
              <div className="space-y-2.5">
                {[
                  { name: 'Meetings', pct: 82, tone: 'bg-coral' },
                  { name: 'Tooling', pct: 54, tone: 'bg-powder' },
                  { name: 'Waiting', pct: 37, tone: 'bg-butter' },
                ].map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-20 text-xs">{c.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.span
                        className={`block h-full rounded-full ${c.tone}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
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
// SECTION 8 — FINAL CTA. The character returns, calm and in control.
// ---------------------------------------------------------------------------

export function FinalCtaSection() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <RevealOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Frustration → insight → control</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Stop guessing where your time goes.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Free to start. No credit card. Your first AI report is on us.
          </p>
          <Magnetic>
            <Button size="lg" className="group mt-8" asChild>
              <Link to="/register">
                Start free <ArrowRight className="h-4 w-4 cta-arrow" />
              </Link>
            </Button>
          </Magnetic>
        </RevealOnScroll>

        <div>
          <HeroScene mood="calm" />
        </div>
      </div>
    </section>
  );
}
