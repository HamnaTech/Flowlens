import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { frictionTier } from '@/components/domain-badges';

interface FrictionGaugeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { width: 160, height: 90, strokeWidth: 10, fontSize: 'text-2xl' },
  md: { width: 220, height: 120, strokeWidth: 12, fontSize: 'text-3xl' },
  lg: { width: 280, height: 150, strokeWidth: 14, fontSize: 'text-4xl' },
};

export function FrictionGauge({ score, size = 'md' }: FrictionGaugeProps) {
  const { width, height, strokeWidth, fontSize } = SIZE_MAP[size];
  const radius = (width - strokeWidth) / 2;
  const centerX = width / 2;
  const centerY = height - strokeWidth / 2;
  const circumference = Math.PI * radius;

  // Score is 0-100, map to 0-180 degrees (semicircle)
  const angle = score !== null ? Math.min(180, Math.max(0, (score / 100) * 180)) : 0;
  const filledLength = (angle / 180) * circumference;

  const tier = score !== null ? frictionTier(score) : 'low';
  const color = tier === 'high' ? 'hsl(var(--destructive))' : tier === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--success))';

  // Needle rotation: -90deg (left) to +90deg (right)
  const needleRotation = score !== null ? -90 + angle : -90;

  // Critical is a gauge-local 4th tier layered on top of the shared
  // 3-value frictionTier() (used elsewhere for badges) — kept local so
  // it doesn't change frictionTier()'s return type for other consumers.
  const isCritical = score !== null && score >= 85;
  const label =
    score === null
      ? 'Analyzing…'
      : isCritical
        ? 'Critical friction'
        : tier === 'high'
          ? 'High friction'
          : tier === 'medium'
            ? 'Moderate friction'
            : 'Low friction';

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Track */}
        <path
          d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${centerY}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {score !== null && (
          <motion.path
            d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${centerY}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: filledLength / circumference }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        )}

        {/* Tick marks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const tickAngle = -90 + (i / 10) * 180;
          const tickRadius = radius - strokeWidth / 2 - 4;
          const x1 = centerX + tickRadius * Math.cos((tickAngle * Math.PI) / 180);
          const y1 = centerY + tickRadius * Math.sin((tickAngle * Math.PI) / 180);
          const x2 = centerX + (tickRadius - 4) * Math.cos((tickAngle * Math.PI) / 180);
          const y2 = centerY + (tickRadius - 4) * Math.sin((tickAngle * Math.PI) / 180);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--muted-foreground) / 0.4)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle */}
        <motion.g
          className="gauge-needle"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          initial={{ rotate: -90 }}
          animate={{ rotate: needleRotation }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - radius + strokeWidth + 8}
            stroke="hsl(var(--foreground))"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={centerX} cy={centerY} r={5} fill="hsl(var(--foreground))" />
          <circle cx={centerX} cy={centerY} r={2.5} fill="hsl(var(--card))" />
        </motion.g>
      </svg>

      {/* Score label */}
      <div className="mt-2 text-center">
        <motion.p
          key={score}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn('font-mono font-bold', fontSize)}
        >
          {score !== null ? score.toFixed(1) : '—'}
        </motion.p>
        <p className={cn('text-xs font-medium', tier === 'high' ? 'text-destructive' : tier === 'medium' ? 'text-warning' : 'text-success')}>
          {label}
        </p>
      </div>
    </div>
  );
}