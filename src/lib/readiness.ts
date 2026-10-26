import type { DailyLog, Period, Profile } from "@/db/schema";
import { clamp } from "./clamp";
import { completedCycles, phaseOnDate, type CycleState, type Phase } from "./cycle";

export type ReadinessBand = "Rest" | "Steady" | "Go";

export interface Readiness {
  score: number;
  band: ReadinessBand;
  breakdown: { label: string; points: number }[];
  // True when neither today nor yesterday has an energy value, so the score rests on the cycle alone.
  isEstimate: boolean;
}

export interface ReadinessInput {
  cycle: CycleState;
  todayLog: DailyLog | null;
  yesterdayLog: DailyLog | null;
  // Used for the personal blend.
  history: { periods: Period[]; logs: DailyLog[]; profile: Profile | null };
}

const PHASE_BASE: Record<Phase, number> = { menstrual: 55, follicular: 80, ovulatory: 85, luteal: 70 };
const LATE_LUTEAL_BASE = 58;
const NO_PHASE_BASE = 70;
const MIN_COMPLETED_CYCLES = 3;
const MIN_PHASE_ENERGY_VALUES = 5;
const PERSONAL_BASE_PER_ENERGY_POINT = 20;
const NEUTRAL_ENERGY = 3;
const POINTS_PER_ENERGY = 5;
const NEUTRAL_SLEEP_HOURS = 7;
const POINTS_PER_SLEEP_HOUR = 4;
const MIN_SLEEP_POINTS = -12;
const MAX_SLEEP_POINTS = 8;
const SEVERITY_PENALTY: Record<1 | 2 | 3, number> = { 1: 0, 2: -4, 3: -8 };
const MAX_SYMPTOM_PENALTY = -20;
const HEAVY_FLOW_PENALTY = -5;
const STEADY_FROM = 45;
const GO_FROM = 70;

function phaseBase(cycle: CycleState): number {
  if (cycle.phase === null) return NO_PHASE_BASE;
  if (cycle.isLateLuteal) return LATE_LUTEAL_BASE;
  return PHASE_BASE[cycle.phase];
}

// Rule 2: 20 x average energy logged in the current phase across completed cycles.
function personalBase(phase: Phase | null, history: ReadinessInput["history"]): number | null {
  if (phase === null) return null;
  const cycles = completedCycles(history.periods, history.profile);
  if (cycles.length < MIN_COMPLETED_CYCLES) return null;

  const energies = history.logs
    .filter((log) => log.energy !== null && phaseOnDate(cycles, log.date)?.phase === phase)
    .map((log) => log.energy as number);
  if (energies.length < MIN_PHASE_ENERGY_VALUES) return null;

  const average = energies.reduce((sum, value) => sum + value, 0) / energies.length;
  return PERSONAL_BASE_PER_ENERGY_POINT * average;
}

export function bandFor(score: number): ReadinessBand {
  if (score >= GO_FROM) return "Go";
  if (score >= STEADY_FROM) return "Steady";
  return "Rest";
}

export function computeReadiness({ cycle, todayLog, yesterdayLog, history }: ReadinessInput): Readiness {
  const breakdown: Readiness["breakdown"] = [];

  // Rules 1 and 2.
  const cycleBase = phaseBase(cycle);
  const personal = personalBase(cycle.phase, history);
  if (personal === null) {
    breakdown.push({ label: "Cycle phase", points: cycleBase });
  } else {
    breakdown.push({ label: "Cycle phase and your history", points: Math.round(0.5 * cycleBase + 0.5 * personal) });
  }

  // Rule 3.
  const energy = todayLog?.energy ?? yesterdayLog?.energy ?? null;
  if (energy !== null) breakdown.push({ label: "Energy", points: (energy - NEUTRAL_ENERGY) * POINTS_PER_ENERGY });

  // Rule 4.
  const sleepHours = todayLog?.sleepHours ?? null;
  if (sleepHours !== null) {
    breakdown.push({
      label: "Sleep",
      points: clamp((sleepHours - NEUTRAL_SLEEP_HOURS) * POINTS_PER_SLEEP_HOUR, MIN_SLEEP_POINTS, MAX_SLEEP_POINTS),
    });
  }

  // Rule 5.
  const symptomPenalty = (todayLog?.symptoms ?? []).reduce((sum, { severity }) => sum + SEVERITY_PENALTY[severity], 0);
  if (symptomPenalty !== 0) breakdown.push({ label: "Symptoms", points: Math.max(symptomPenalty, MAX_SYMPTOM_PENALTY) });

  // Rule 6.
  if (todayLog?.bleeding === "heavy" || todayLog?.bleeding === "very-heavy") {
    breakdown.push({ label: "Heavy flow", points: HEAVY_FLOW_PENALTY });
  }

  // Rule 7.
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);
  const score = Math.round(clamp(total, 0, 100));
  return { score, band: bandFor(score), breakdown, isEstimate: energy === null };
}
