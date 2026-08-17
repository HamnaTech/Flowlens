import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

const STAGES = [
  'Analyzing your frustrations…',
  'Identifying recurring patterns…',
  'Calculating friction trends…',
  'Generating recommendations…',
];

/**
 * Cycles through illustrative stage text on a timer purely for visual
 * interest — it does NOT determine when the report is actually done. The
 * parent (ReportDetailPage) still polls real report.status and only ever
 * renders the COMPLETED view when the backend genuinely reports COMPLETED.
 * If generation takes longer than the stage list, it holds on the last
 * stage rather than looping back to "Analyzing…", which would misleadingly
 * suggest it restarted.
 */
export function AIProcessingStages({ queued }: { queued: boolean }) {
  const [stageIndex, setStageIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (queued) return;
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [queued]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-background/50 py-12 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-peach"
          animate={reduce ? { opacity: 0.8 } : { scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm">
          {queued ? <Sparkles className="h-4 w-4 text-primary" /> : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>

      <div className="h-5">
        <AnimatePresence mode="wait">
          <motion.p
            key={queued ? 'queued' : stageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-medium"
          >
            {queued ? 'Queued for analysis…' : STAGES[stageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <p className="animate-soft-pulse text-xs text-muted-foreground">This page updates automatically — no need to refresh.</p>
    </div>
  );
}
