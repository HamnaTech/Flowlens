import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic, WordsReveal } from '@/lib/motion';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Full-bleed background photo — fills the entire hero area, edge to edge */}
      <img
        src="/images/frustrated-worker.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />

      {/* Soft, mostly-transparent gradient scrims so the photo blends naturally
          into the section while keeping the headline readable. The photo remains
          visible across the whole hero — this is a background, not a box. */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-background/5" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:pb-24 lg:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* Copy column */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            AI-powered user friction analytics
          </motion.div>

          <h1 className="font-display text-[2.75rem] font-bold leading-[1.02] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-[4.25rem]">
            <WordsReveal text="See where your" />
            <br />
            <WordsReveal text="users get stuck." delay={0.18} highlight="stuck." />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            FlowLens uses AI-powered behavior analysis to uncover friction, hesitation,
            and drop-offs across the user journey.
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
                  Get Started <ArrowRight className="h-4 w-4 cta-arrow" />
                </Link>
              </Button>
            </Magnetic>
            <Button size="lg" variant="outline" className="bg-background/60 backdrop-blur-sm" asChild>
              <Link to="/dashboard">Explore Demo</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            <span>Understand exactly where users hesitate</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}