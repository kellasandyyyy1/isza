"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CycleState, Phase } from "@/lib/cycle";
import { RING_VIEW, ringLayout } from "@/lib/cycleRing";
import { PHASE_NAMES } from "./todayConfig";

// The phase name is the ring's legend, in its phase color. At 24px bold it is large text, where these colors
// reach 3:1 on the tinted hero card.
const PHASE_TEXT: Record<Phase, string> = {
  menstrual: "text-phase-menstrual",
  follicular: "text-phase-follicular",
  ovulatory: "text-phase-ovulatory",
  luteal: "text-phase-luteal",
};

interface CycleDotRingProps {
  cycleState: CycleState;
  // A CSS length. The ring is drawn in RING_VIEW units and scaled to it.
  size: string;
}

// One dot per day of the cycle around a clear centre with the cycle day. Today is the one ink dot, ringed in the
// card's own background so it stands off its neighbours. The dots are decorative: the label says it all.
export function CycleDotRing({ cycleState, size }: CycleDotRingProps) {
  const reduced = useReducedMotion() === true;
  const { phase, cycleDay } = cycleState;
  const layout = ringLayout(cycleState);
  const day = cycleDay ?? 1;
  const label = phase
    ? `Cycle ring. Day ${day} of about ${layout.dayCount}, ${PHASE_NAMES[phase].toLowerCase()} phase.`
    : `Cycle ring. Day ${day} of about ${layout.dayCount}.`;
  // The same background as the hero card, which is tinted by phase (bg-phase-*-surface in globals.css).
  const cardBackground = phase ? `color-mix(in srgb, var(--phase-${phase}) 14%, var(--surface))` : "var(--surface)";
  // Drawn last, so its outline sits over its neighbours.
  const dots = [...layout.dots].sort((a, b) => Number(a.isToday) - Number(b.isToday));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <motion.svg
        viewBox={`0 0 ${RING_VIEW} ${RING_VIEW}`}
        role="img"
        aria-label={label}
        className="absolute inset-0 size-full"
        // One fade on mount, the same first frame on server and client.
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
      >
        {dots.map((dot) => (
          <circle
            key={dot.index}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={dot.fill}
            fillOpacity={dot.opacity}
            stroke={dot.isToday ? cardBackground : undefined}
            strokeWidth={dot.isToday ? 2 : undefined}
          />
        ))}
      </motion.svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-display text-ink">Day {day}</span>
        {phase && <span className={`text-h1 ${PHASE_TEXT[phase]}`}>{PHASE_NAMES[phase]}</span>}
        {phase && !cycleState.cycleLengthIsEstimate && (
          <span className="text-caption text-ink-muted">of {layout.dayCount}</span>
        )}
      </div>
    </div>
  );
}
