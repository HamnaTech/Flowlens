import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Bug, Check, Clock, MessageSquare, Repeat, Shuffle, Sparkles } from 'lucide-react';
import { usersApi } from '@/api/users.api';
import { categoriesApi } from '@/api/categories.api';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/motion';

type WorkType = 'Development' | 'Design' | 'Writing' | 'Marketing' | 'Student' | 'Other';
type FrictionCause = 'Slow tools' | 'Repetitive tasks' | 'Context switching' | 'Bugs & errors' | 'Communication' | 'Other';

const WORK_TYPES: { value: WorkType; icon: typeof Bug }[] = [
  { value: 'Development', icon: Bug },
  { value: 'Design', icon: Sparkles },
  { value: 'Writing', icon: MessageSquare },
  { value: 'Marketing', icon: Shuffle },
  { value: 'Student', icon: Clock },
  { value: 'Other', icon: Repeat },
];

const FRICTION_CAUSES: { value: FrictionCause; icon: typeof Bug }[] = [
  { value: 'Slow tools', icon: Clock },
  { value: 'Repetitive tasks', icon: Repeat },
  { value: 'Context switching', icon: Shuffle },
  { value: 'Bugs & errors', icon: Bug },
  { value: 'Communication', icon: MessageSquare },
  { value: 'Other', icon: Sparkles },
];

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [frictionCause, setFrictionCause] = useState<FrictionCause | null>(null);
  const [direction, setDirection] = useState(1);

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Real, meaningful use of their answer — not decorative. Creates an
      // actual starter category via the real categories API so their first
      // log has somewhere relevant to go, rather than storing the answer
      // nowhere and pretending it mattered.
      if (frictionCause) {
        await categoriesApi.create({ name: frictionCause, color: '#9E81E0' }).catch(() => {
          // Non-fatal — a duplicate/edge-case category name shouldn't block
          // onboarding completion.
        });
      }
      // Marks onboarding complete via the real, pre-existing backend field.
      // Value itself is just a "done" flag (any non-zero step) — no new
      // backend field was invented for this.
      await usersApi.updateOnboardingStep(TOTAL_STEPS);
    },
    onSuccess: async () => {
      // OnboardingGate caches the profile with staleTime: Infinity, so it
      // would still see onboardingStep === 0 after we navigate. Force a
      // refetch of that exact query so the gate sees the completed state.
      await queryClient.refetchQueries({ queryKey: ['profile', 'onboarding-check'] });
      navigate('/dashboard', { replace: true });
    },
    onError: () => {
      toast.error("Couldn't save your preferences, but you're all set — heading to your dashboard.");
      navigate('/dashboard', { replace: true });
    },
  });

  function goNext() {
    setDirection(1);
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else completeMutation.mutate();
  }

  function skip() {
    completeMutation.mutate();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full ai-gradient-bg blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo iconClassName="h-6 w-6" textClassName="text-base" />
          {step < TOTAL_STEPS && (
            <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground">
              Skip
            </button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: i < step ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: EASE.out }}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <Step key="1" direction={direction}>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to FlowLens</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Most productivity tools track time. FlowLens tracks what's actually going wrong — so
                AI can show you what's worth fixing. Two quick questions, then you're in.
              </p>
              <Button className="mt-6 w-full" onClick={goNext}>
                Let's go <ArrowRight className="h-4 w-4" />
              </Button>
            </Step>
          )}

          {step === 2 && (
            <Step key="2" direction={direction}>
              <h2 className="font-display text-xl font-semibold tracking-tight">What kind of work do you do?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Helps FlowLens suggest relevant categories.</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {WORK_TYPES.map(({ value, icon: Icon }) => (
                  <OptionCard key={value} selected={workType === value} onClick={() => setWorkType(value)} icon={Icon} label={value} />
                ))}
              </div>
              <Button className="mt-6 w-full" disabled={!workType} onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </Step>
          )}

          {step === 3 && (
            <Step key="3" direction={direction}>
              <h2 className="font-display text-xl font-semibold tracking-tight">What usually causes the most friction?</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll create a starter category for this.</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {FRICTION_CAUSES.map(({ value, icon: Icon }) => (
                  <OptionCard key={value} selected={frictionCause === value} onClick={() => setFrictionCause(value)} icon={Icon} label={value} />
                ))}
              </div>
              <Button className="mt-6 w-full" disabled={!frictionCause} onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </Step>
          )}

          {step === 4 && (
            <Step key="4" direction={direction}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15"
              >
                <Check className="h-7 w-7 text-success" />
              </motion.div>
              <h2 className="mt-4 text-center font-display text-xl font-semibold tracking-tight">You're ready.</h2>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Your dashboard is set up. Log your first frustration whenever something slows you down.
              </p>
              <Button className="mt-6 w-full" onClick={goNext} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? 'Setting up…' : 'Go to dashboard'}
              </Button>
            </Step>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Step({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      custom={direction}
      initial={{ opacity: 0, x: direction * 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -24 }}
      transition={{ duration: 0.3, ease: EASE.out }}
      className="premium-card rounded-2xl p-6"
    >
      {children}
    </motion.div>
  );
}

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Bug;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40 hover:bg-accent/50',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
