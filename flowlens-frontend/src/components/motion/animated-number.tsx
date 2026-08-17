import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 30, stiffness: 100 });

  useEffect(() => {
    if (isInView && !reduce) motionValue.set(value);
  }, [isInView, value, motionValue, reduce]);

  useEffect(() => {
    if (reduce && ref.current) {
      ref.current.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      return;
    }
    return spring.on('change', (latest) => {
      if (ref.current) ref.current.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
    });
  }, [spring, prefix, suffix, decimals, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
