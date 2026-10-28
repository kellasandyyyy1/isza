import { clamp } from "./clamp";
import { phaseForCycleDay, type CycleState } from "./cycle";

// The ring is drawn in these SVG units and scaled to its CSS size, so at 200px one unit is one pixel.
export const RING_VIEW = 200;
const RING_INSET = 14;
const CLEAR_GAP = 16;
const DOT_SPACING_SHARE = 0.28;
const MIN_DOT_RADIUS = 2.5;
const MAX_DOT_RADIUS = 5;
const TODAY_EXTRA_RADIUS = 2.5;
export const MAX_LATE_DOTS = 14;
const DEFAULT_DAY_COUNT = 28;
const SOFT = 0.35;
const FUTURE = 0.6;
const LATE_OPACITY = 0.5;
const FERTILE_DAYS_BEFORE = 5;
const FERTILE_DAYS_AFTER = 1;

export interface RingDot {
  // 1-based position on the ring. Past the cap in a late cycle, today's dot takes the last position.
  index: number;
  x: number;
  y: number;
  r: number;
  // A CSS color.
  fill: string;
  opacity: number;
  isToday: boolean;
}

export interface RingLayout {
  dayCount: number;
  // Dots past dayCount: the days after the expected cycle length, at most 14.
  extraDots: number;
  ringRadius: number;
  // No dot reaches inside this radius: the centre text sits there.
  clearRadius: number;
  dots: RingDot[];
}

// The color and opacity of one day, before today's override and the future fade.
function dayStyle(state: CycleState, day: number, dayCount: number): { fill: string; opacity: number } {
  if (state.mode !== "standard") return { fill: "var(--surface-2)", opacity: 1 };
  if (day > dayCount) return { fill: "var(--ink-muted)", opacity: LATE_OPACITY };
  const { periodLoggedDays, menstrualEnd, ovulationDay } = state;
  if (periodLoggedDays !== null && day <= periodLoggedDays && (state.cycleDay === null || day <= state.cycleDay)) {
    return { fill: "var(--period)", opacity: 1 };
  }
  if (menstrualEnd !== null && day <= menstrualEnd) return { fill: "var(--period)", opacity: SOFT };
  if (ovulationDay !== null && day >= ovulationDay - FERTILE_DAYS_BEFORE && day <= ovulationDay + FERTILE_DAYS_AFTER) {
    return { fill: "var(--phase-ovulatory)", opacity: 1 };
  }
  const phase = phaseForCycleDay(day, menstrualEnd ?? 0, ovulationDay ?? dayCount);
  return { fill: `var(--phase-${phase})`, opacity: SOFT };
}

// One dot per day of the average cycle, day 1 at 12 o'clock, clockwise. Past the expected length the ring
// keeps going in muted dots, up to 14, and today is the last of them. Today is the only full-contrast dot.
export function ringLayout(state: CycleState, size = RING_VIEW): RingLayout {
  const dayCount = Math.round(state.avgCycleLength ?? DEFAULT_DAY_COUNT);
  const cycleDay = state.cycleDay;
  const extraDots = cycleDay !== null && cycleDay > dayCount ? Math.min(cycleDay - dayCount, MAX_LATE_DOTS) : 0;
  const total = dayCount + extraDots;
  const todayIndex = cycleDay === null ? null : Math.min(cycleDay, total);

  const center = size / 2;
  const ringRadius = size / 2 - RING_INSET;
  const clearRadius = ringRadius - CLEAR_GAP;
  const spacing = (2 * Math.PI * ringRadius) / total;
  const dotRadius = clamp(spacing * DOT_SPACING_SHARE, MIN_DOT_RADIUS, MAX_DOT_RADIUS);

  const dots = Array.from({ length: total }, (_, offset): RingDot => {
    const index = offset + 1;
    const angle = -Math.PI / 2 + (2 * Math.PI * offset) / total;
    const position = { index, x: center + ringRadius * Math.cos(angle), y: center + ringRadius * Math.sin(angle) };
    if (index === todayIndex) {
      return { ...position, r: dotRadius + TODAY_EXTRA_RADIUS, fill: "var(--ink)", opacity: 1, isToday: true };
    }
    const style = dayStyle(state, index, dayCount);
    const future = todayIndex !== null && index > todayIndex;
    return { ...position, r: dotRadius, fill: style.fill, opacity: future ? style.opacity * FUTURE : style.opacity, isToday: false };
  });

  return { dayCount, extraDots, ringRadius, clearRadius, dots };
}
