import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroScene } from './hero-scene';
import { Magnetic, WordsReveal } from '@/lib/motion';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-24 lg:pt-20">
        {/* Copy column */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            Friction analytics for people who&apos;ve had enough
          </motion.div>

          <h1 className="font-display text-[2.75rem] font-bold leading-[1.02] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-[4.25rem]">
            <WordsReveal text="Find out what's" />
            <br />
            <WordsReveal text="actually slowing" delay={0.18} />
            <br />
            <WordsReveal text="you down." delay={0.36} highlight="down" />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            FlowLens captures the small frustrations that quietly eat your week — slow tools,
            dead-end meetings, endless waiting — then shows you exactly what to fix first.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.72 }}
            className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <Magnetic>
              <Button size="lg" className="group" asChild>
                <Link to="/register">
                  Start free <ArrowRight className="h-4 w-4 cta-arrow" />
                </Link>
              </Button>
            </Magnetic>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-5 text-xs text-muted-foreground"
          >
            Free to start · No credit card · Your first AI report is on us
          </motion.p>
        </div>

        {/* Scene column */}
        <div className="relative">
          <HeroScene mood="frustrated" />
        </div>
      </div>
    </section>
  );
}
