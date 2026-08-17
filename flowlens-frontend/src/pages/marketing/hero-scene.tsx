import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';

/**
 * The signature FlowLens illustration: a stylized, semi-dimensional desk
 * scene rendered entirely in SVG (no heavy 3D runtime) with layered
 * parallax, continuous micro-animation, and a "mood" that carries the
 * product story — `frustrated` in the hero, `calm` in the closing CTA.
 *
 * Depth is faked the honest way: stacked planes, a raised desk edge, soft
 * contact shadows, and scroll-driven layer offsets. All motion respects
 * prefers-reduced-motion.
 */

type Mood = 'frustrated' | 'calm';

const FRICTION_CHIPS = [
  { label: 'Meeting overran', time: '9:42', tone: 'peach', top: '6%', left: '-4%', delay: 0.2, depth: 1 },
  { label: 'Slack interruption', time: '10:17', tone: 'butter', top: '2%', right: '-6%', delay: 0.5, depth: 1.4 },
  { label: 'Context switch', time: '10:31', tone: 'lavender', top: '40%', right: '-9%', delay: 0.8, depth: 1.8 },
  { label: 'Waiting on approval', time: '11:05', tone: 'powder', top: '58%', left: '-8%', delay: 1.1, depth: 1.5 },
] as const;

const TONE_CLASS: Record<string, string> = {
  peach: 'bg-peach text-peach-foreground',
  butter: 'bg-butter text-butter-foreground',
  lavender: 'bg-lavender text-lavender-foreground',
  powder: 'bg-powder text-powder-foreground',
  mint: 'bg-mint text-mint-foreground',
};

export function HeroScene({ mood = 'frustrated' }: { mood?: Mood }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Different layers drift at different rates → depth as you scroll.
  const yBack = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 30]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 4]);
  const chipFade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const isCalm = mood === 'calm';

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[560px]">
      {/* Soft solid backdrop panel — layered depth, no gradient */}
      <motion.div
        style={{ y: yBack, rotate: reduce ? 0 : rotate }}
        className="absolute inset-x-6 top-8 -z-10 aspect-[5/4] rounded-[2rem] bg-card shadow-[var(--shadow-lg)]"
        aria-hidden
      />
      <motion.div
        style={{ y: yBack }}
        className={`absolute inset-x-2 top-4 -z-20 aspect-[5/4] rounded-[2.2rem] ${isCalm ? 'bg-mint' : 'bg-peach/60'}`}
        aria-hidden
      />

      <motion.div style={{ y: yMid }}>
        <SceneSvg mood={mood} reduce={!!reduce} />
      </motion.div>

      {/* Story chips — friction accumulating around a frustrated worker */}
      {!isCalm &&
        FRICTION_CHIPS.map((chip) => (
          <FloatingChip key={chip.label} chip={chip} yFront={yFront} chipFade={chipFade} reduce={!!reduce} />
        ))}

      {/* Calm mood: a single, quiet "in control" marker */}
      {isCalm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="absolute -right-2 top-6 hidden rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-md)] sm:block"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Friction this week</p>
          <p className="font-mono text-lg font-semibold text-secondary">Down 41%</p>
        </motion.div>
      )}
    </div>
  );
}

function FloatingChip({
  chip,
  yFront,
  chipFade,
  reduce,
}: {
  chip: (typeof FRICTION_CHIPS)[number];
  yFront: MotionValue<number>;
  chipFade: MotionValue<number>;
  reduce: boolean;
}) {
  const style: React.CSSProperties = { top: chip.top };
  if ('left' in chip && chip.left !== undefined) style.left = chip.left;
  if ('right' in chip && chip.right !== undefined) style.right = chip.right;

  return (
    <motion.div
      style={{ ...style, y: yFront, opacity: chipFade }}
      className="absolute z-10 hidden sm:block"
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: chip.delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 3 + chip.depth, repeat: Infinity, ease: 'easeInOut' }}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 shadow-[var(--shadow-md)] ${TONE_CLASS[chip.tone]}`}
      >
        <span className="font-mono text-[10px] font-semibold opacity-70">{chip.time}</span>
        <span className="text-xs font-medium">{chip.label}</span>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// The scene itself. Flat-illustration character + desk, built from primitive
// shapes with solid pastel fills and soft contact shadows for dimensionality.
// ---------------------------------------------------------------------------

function SceneSvg({ mood, reduce }: { mood: Mood; reduce: boolean }) {
  const isCalm = mood === 'calm';
  const sweater = isCalm ? 'hsl(var(--sage))' : 'hsl(var(--coral))';
  const sweaterShade = isCalm ? 'hsl(var(--sage-foreground) / 0.12)' : 'hsl(var(--coral-foreground) / 0.12)';
  const skin = '#E7B79A';
  const skinShade = '#D8A184';
  const hair = 'hsl(24 22% 20%)';
  const ink = 'hsl(var(--foreground))';

  const loop = (v: object) => (reduce ? undefined : v);

  return (
    <svg viewBox="0 0 520 440" className="relative w-full" role="img" aria-label={isCalm ? 'A person working calmly at a tidy desk' : 'A person becoming frustrated at a cluttered desk'}>
      {/* Contact shadow under the whole scene */}
      <ellipse cx="260" cy="404" rx="196" ry="22" fill="hsl(var(--foreground) / 0.06)" />

      {/* Rug / podium giving isometric grounding */}
      <ellipse cx="260" cy="388" rx="176" ry="40" fill={isCalm ? 'hsl(var(--mint))' : 'hsl(var(--butter))'} opacity="0.55" />

      {/* Chair back behind character */}
      <rect x="196" y="150" width="128" height="150" rx="30" fill="hsl(var(--powder))" />
      <rect x="196" y="150" width="128" height="150" rx="30" fill="hsl(var(--powder-foreground) / 0.08)" />
      <rect x="210" y="166" width="100" height="120" rx="22" fill="hsl(var(--powder))" />

      {/* ---- Character ---- */}
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: '260px 320px' }}
        animate={loop({ y: [0, -3, 0] })}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Torso / sweater — leaned forward when frustrated */}
        <g transform={isCalm ? 'translate(0,0)' : 'translate(0,6)'}>
          <path
            d="M198 330 Q198 250 260 250 Q322 250 322 330 Z"
            fill={sweater}
          />
          <path d="M198 330 Q198 250 260 250 Q322 250 322 330 Z" fill={sweaterShade} opacity="0.5" transform="translate(6,0)" />

          {/* Left arm resting on desk / laptop */}
          <path d="M214 300 Q188 320 196 348 L232 348 Q236 318 246 306 Z" fill={sweater} />

          {/* Right arm: frustrated → up to forehead; calm → resting */}
          {isCalm ? (
            <path d="M306 300 Q332 320 324 348 L288 348 Q284 318 274 306 Z" fill={sweater} />
          ) : (
            <motion.path
              style={{ transformBox: 'view-box', transformOrigin: '300px 296px' }}
              animate={loop({ rotate: [0, -2.5, 0] })}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              d="M300 296 Q330 268 300 232 Q288 226 278 236 Q292 262 276 290 Z"
              fill={sweater}
            />
          )}
        </g>

        {/* Neck */}
        <rect x="248" y="214" width="24" height="30" rx="10" fill={skin} />
        <rect x="248" y="214" width="24" height="14" rx="7" fill={skinShade} opacity="0.5" />

        {/* Head — subtle frustrated shake / calm stillness */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '260px 200px' }}
          animate={loop(isCalm ? { rotate: [0, 1.2, 0] } : { rotate: [-1.6, 1.6, -1.6] })}
          transition={{ duration: isCalm ? 6 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="260" cy="184" r="42" fill={skin} />
          <path d="M226 176 Q222 132 260 130 Q300 130 296 178 Q286 156 260 156 Q236 156 226 176 Z" fill={hair} />

          {/* Eyes — calm open / frustrated squint */}
          {isCalm ? (
            <>
              <circle cx="246" cy="184" r="3.4" fill={ink} />
              <circle cx="276" cy="184" r="3.4" fill={ink} />
            </>
          ) : (
            <>
              <path d="M240 184 q6 -4 12 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M270 184 q6 -4 12 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Brow furrow */}
              <path d="M238 174 l12 4" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
              <path d="M282 174 l-12 4" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
            </>
          )}

          {/* Mouth — slight smile / frown */}
          {isCalm ? (
            <path d="M250 200 q10 8 20 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M250 204 q10 -7 20 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          )}
        </motion.g>

        {/* Frustration sweat drop */}
        {!isCalm && (
          <motion.path
            d="M300 168 q5 8 0 13 q-5 -5 0 -13 Z"
            fill="hsl(var(--powder))"
            animate={loop({ opacity: [0, 1, 0], y: [0, 6, 12] })}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeIn', repeatDelay: 1.4 }}
          />
        )}
      </motion.g>

      {/* ---- Desk ---- */}
      <g>
        {/* Desk thickness (front edge) for depth */}
        <rect x="70" y="344" width="380" height="40" rx="10" fill="hsl(var(--muted))" />
        <rect x="70" y="336" width="380" height="20" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Laptop */}
        <g transform="translate(228,300)">
          <rect x="-42" y="0" width="84" height="52" rx="6" fill="hsl(var(--foreground))" />
          <rect x="-38" y="4" width="76" height="44" rx="4" fill="hsl(var(--card))" />
          {/* screen activity */}
          <rect x="-30" y="12" width="42" height="4" rx="2" fill={isCalm ? 'hsl(var(--sage))' : 'hsl(var(--coral))'} />
          <rect x="-30" y="22" width="56" height="3" rx="1.5" fill="hsl(var(--muted))" />
          <rect x="-30" y="30" width="34" height="3" rx="1.5" fill="hsl(var(--muted))" />
          {/* blinking cursor */}
          <motion.rect x="8" y="29" width="2" height="6" fill="hsl(var(--foreground))" animate={loop({ opacity: [1, 0, 1] })} transition={{ duration: 1.1, repeat: Infinity }} />
          <rect x="-46" y="52" width="92" height="6" rx="3" fill="hsl(var(--muted))" />
        </g>

        {/* Typing hands on the laptop base */}
        <motion.circle cx="200" cy="352" r="9" fill={skin} animate={loop({ y: [0, -2.5, 0] })} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.circle cx="320" cy="352" r="9" fill={skin} animate={loop({ y: [0, -2.5, 0] })} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }} />

        {/* Coffee mug with steam */}
        <g transform="translate(120,320)">
          <rect x="0" y="10" width="34" height="30" rx="8" fill="hsl(var(--butter))" />
          <rect x="0" y="10" width="34" height="10" rx="5" fill="hsl(var(--card))" opacity="0.5" />
          <path d="M34 16 q14 2 14 12 q0 10 -14 10" fill="none" stroke="hsl(var(--butter))" strokeWidth="5" />
          <motion.path d="M8 6 q6 -8 0 -16" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2.4" strokeLinecap="round" opacity="0.5"
            animate={loop({ opacity: [0, 0.5, 0], y: [0, -6, -12] })} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }} />
          <motion.path d="M20 6 q6 -8 0 -16" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2.4" strokeLinecap="round" opacity="0.5"
            animate={loop({ opacity: [0, 0.5, 0], y: [0, -6, -12] })} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 0.8 }} />
        </g>

        {/* Notebook + pen */}
        <g transform="translate(348,332)">
          <rect x="0" y="0" width="56" height="30" rx="4" fill="hsl(var(--mint))" transform="rotate(-8 28 15)" />
          <rect x="8" y="8" width="40" height="3" rx="1.5" fill="hsl(var(--mint-foreground) / 0.4)" transform="rotate(-8 28 15)" />
          <rect x="8" y="16" width="30" height="3" rx="1.5" fill="hsl(var(--mint-foreground) / 0.4)" transform="rotate(-8 28 15)" />
          <rect x="30" y="-6" width="4" height="40" rx="2" fill="hsl(var(--coral))" transform="rotate(24 32 14)" />
        </g>

        {/* Small plant */}
        <g transform="translate(92,300)">
          <path d="M14 44 Q6 20 -2 8" stroke="hsl(var(--sage))" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M18 44 Q22 18 30 6" stroke="hsl(var(--secondary))" strokeWidth="5" fill="none" strokeLinecap="round" />
          <motion.path d="M16 44 Q16 22 16 6" stroke="hsl(var(--sage))" strokeWidth="5" fill="none" strokeLinecap="round"
            style={{ transformBox: 'view-box', transformOrigin: '16px 44px' }}
            animate={loop({ rotate: [-2, 2, -2] })} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <path d="M6 44 h24 l-3 20 h-18 Z" fill="hsl(var(--peach))" />
        </g>
      </g>
    </svg>
  );
}
