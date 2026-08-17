import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FrictionGauge } from '@/components/friction-gauge';
import { FloatingElement } from '@/lib/motion';
import { EASE, DURATION } from '@/lib/motion';

const HEADLINE_WORDS = ['Turn', 'workplace', 'friction', 'into', 'flow.'];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      {/* Subtle animated gradient wash — decorative only, purposeful not chaotic */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[-10%] h-[500px] w-[900px] -translate-x-1/2 rounded-full ai-gradient-bg blur-3xl"
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.ui }}
          className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          AI-powered friction tracking
        </motion.div>

        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={word + i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.hero, delay: i * 0.08, ease: EASE.out }}
              className={word === 'flow.' ? 'ai-gradient-text inline-block' : 'inline-block'}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.ui, delay: 0.5 }}
          className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground"
        >
          FlowLens logs the small frustrations that quietly eat your week — slow tools, dead-end
          meetings, waiting on approvals — and uses AI to show you exactly what to fix first.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.ui, delay: 0.65 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link to="/register">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#how-it-works">See how it works</a>
          </Button>
        </motion.div>
      </div>

      {/* Product preview — gauge + floating context cards */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.hero, delay: 0.8, ease: EASE.out }}
        className="relative mx-auto mt-16 max-w-2xl"
      >
        <div className="premium-card relative flex flex-col items-center gap-4 rounded-3xl p-10">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Illustrative preview
          </span>
          <FrictionGauge score={34} size="lg" />
          <p className="text-center text-sm text-muted-foreground">
            Low friction this week — meetings are trending down 18%.
          </p>
        </div>

        <FloatingElement duration={5} className="absolute -left-6 top-6 hidden sm:block">
          <div className="premium-card rounded-xl px-4 py-3 text-left shadow-lg">
            <p className="text-xs text-muted-foreground">Time saved</p>
            <p className="font-mono text-lg font-semibold text-secondary">2h 40m</p>
          </div>
        </FloatingElement>

        <FloatingElement duration={4.5} delay={0.5} className="absolute -right-8 bottom-10 hidden sm:block">
          <div className="premium-card rounded-xl px-4 py-3 text-left shadow-lg">
            <p className="text-xs text-muted-foreground">AI recommendation</p>
            <p className="max-w-[160px] text-xs font-medium">Shorten standups to 10 min</p>
          </div>
        </FloatingElement>
      </motion.div>
    </section>
  );
}
