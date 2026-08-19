import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MousePointer2 } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Magnetic, WordsReveal } from '@/lib/motion';
import { Journey3D, HeroSceneFallback } from '@/components/three/journey-3d';

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
            <Button size="lg" variant="outline" asChild>
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
            <span>Move your mouse to explore the journey</span>
          </motion.div>
        </div>

        {/* 3D Scene column */}
        <div className="relative h-[320px] sm:h-[420px] lg:h-[500px]">
          <Suspense fallback={<HeroSceneFallback />}>
            <Journey3D />
          </Suspense>

          {/* Legend overlay */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-xl border border-border bg-card/90 px-4 py-3 text-xs shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
              <span className="text-muted-foreground">Smooth flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Friction point</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Journey stage</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
