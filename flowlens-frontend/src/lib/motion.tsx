import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

// ----------------------------------------------------------------------
// Timing tokens — three tiers per the animation philosophy: micro (hover/
// buttons), UI (cards/modals/nav), hero (landing/storytelling). Every
// animated component in the app should pull from these rather than
// inventing its own duration/easing.
// ----------------------------------------------------------------------
export const DURATION = {
  micro: 0.15,
  ui: 0.35,
  hero: 0.9,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const, // ease-out-expo — confident, no overshoot
  spring: [0.34, 1.56, 0.64, 1] as const, // used by the FrictionGauge already
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.ui, ease: EASE.out } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.ui, ease: EASE.out } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.ui, ease: EASE.out } },
};

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Wraps children that fade + slide up together, respecting reduced-motion. */
export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reduce ? fadeIn : fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Same as FadeIn but triggers once when scrolled into view — for landing-page sections. */
export function RevealOnScroll({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reduce ? fadeIn : fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial="hidden" animate="visible" variants={reduce ? fadeIn : scaleIn} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
}

/** Parent for staggered children — pair with <StaggerItem> for lists/grids revealing in sequence. */
export function StaggerContainer({ children, className, viewport = false }: { children: ReactNode; className?: string; viewport?: boolean }) {
  const props = viewport
    ? { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-60px' } }
    : { initial: 'hidden', animate: 'visible' };
  return (
    <motion.div variants={staggerContainerVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? fadeIn : fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}

/** Gentle continuous vertical float — for decorative hero elements only, never content. */
export function FloatingElement({ children, className, duration = 4, delay = 0 }: { children: ReactNode; className?: string; duration?: number; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magnetic wrapper — the child gently follows the cursor while hovered and
 * springs back on leave. Used on primary CTAs for a tactile micro-interaction.
 * Disabled entirely under reduced-motion.
 */
export function Magnetic({ children, className, strength = 0.35 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word headline reveal — solid ink, editorial cadence. */
export function WordsReveal({ text, className, highlight, delay = 0 }: { text: string; className?: string; highlight?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const highlightWords = highlight ? highlight.split(' ') : [];
  return (
    <span className={className}>
      {words.map((word, i) => {
        const isHi = highlightWords.includes(word.replace(/[.,]/g, ''));
        return (
          <span key={word + i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className={isHi ? 'inline-block text-primary' : 'inline-block'}
              initial={reduce ? { opacity: 0 } : { y: '110%' }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              transition={{ duration: 0.7, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
              {i < words.length - 1 ? '\u00A0' : ''}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/** Page-level transition wrapper — used once per route in App.tsx via AnimatePresence. */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.ui, ease: EASE.out } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.micro } },
};
