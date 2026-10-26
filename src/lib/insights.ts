import type { DailyLog, Period, Profile, SymptomKey, Workout } from "@/db/schema";
import { symptomKeySchema } from "@/db/schema";
import { PHASES, completedCycles, phaseOnDate, type CompletedCycle, type Phase } from "./cycle";

export type InsightKind = "symptom-pattern" | "energy-by-phase" | "best-training-window";

export interface Insight {
  kind: InsightKind;
  phase: Phase;
  text: string;
}

export interface InsightsInput {
  periods: Period[];
  logs: DailyLog[];
  workouts: Workout[];
  profile: Profile | null;
}

const MIN_COMPLETED_CYCLES = 2;
const SYMPTOM_WINDOW = 5;
const SYMPTOM_MIN_CYCLES = 3;
const MIN_WORKOUTS_IN_PHASE = 4;

export const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  cramps: "Cramps",
  headache: "Headache",
  bloating: "Bloating",
  "breast-tenderness": "Breast tenderness",
  acne: "Acne",
  "back-pain": "Back pain",
  nausea: "Nausea",
  fatigue: "Fatigue",
  cravings: "Cravings",
  irritability: "Irritability",
  anxiety: "Anxiety",
  insomnia: "Insomnia",
};

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export type StrongTally = Record<Phase, { total: number; strong: number }>;

// Workouts in completed cycles, counted per phase. Shared by the best training window and the Train chart.
export function strongWorkoutsByPhase(cycles: CompletedCycle[], workouts: Workout[]): StrongTally {
  const tally = Object.fromEntries(PHASES.map((phase) => [phase, { total: 0, strong: 0 }])) as StrongTally;
  for (const workout of workouts) {
    const phase = phaseOnDate(cycles, workout.date)?.phase;
    if (!phase) continue;
    tally[phase].total += 1;
    if (workout.feel === "strong") tally[phase].strong += 1;
  }
  return tally;
}

export function computeInsights({ periods, logs, workouts, profile }: InsightsInput): Insight[] {
  const cycles = completedCycles(periods, profile);
  if (cycles.length < MIN_COMPLETED_CYCLES) return [];
  const insights: Insight[] = [];

  // Symptom pattern: same symptom in the same phase in 3 or more of the last 5 completed cycles.
  const recentCycles = cycles.slice(-SYMPTOM_WINDOW);
  const firstRecentIndex = cycles.length - recentCycles.length;
  const seen = new Map<string, Set<number>>();
  for (const log of logs) {
    const located = phaseOnDate(cycles, log.date);
    if (!located || located.cycleIndex < firstRecentIndex) continue;
    for (const { key } of log.symptoms) {
      const id = `${key}|${located.phase}`;
      seen.set(id, (seen.get(id) ?? new Set()).add(located.cycleIndex));
    }
  }
  for (const phase of PHASES) {
    for (const key of symptomKeySchema.options) {
      const count = seen.get(`${key}|${phase}`)?.size ?? 0;
      if (count >= SYMPTOM_MIN_CYCLES) {
        insights.push({
          kind: "symptom-pattern",
          phase,
          text: `${SYMPTOM_LABELS[key]} often shows up in your ${phase} phase (${count} of your last ${recentCycles.length} cycles).`,
        });
      }
    }
  }

  // Energy by phase: average logged energy per phase across completed cycles.
  for (const phase of PHASES) {
    const energies = logs
      .filter((log) => log.energy !== null && phaseOnDate(cycles, log.date)?.phase === phase)
      .map((log) => log.energy as number);
    if (energies.length === 0) continue;
    const average = roundToTenth(energies.reduce((sum, value) => sum + value, 0) / energies.length);
    insights.push({
      kind: "energy-by-phase",
      phase,
      text: `Your energy averages ${average.toFixed(1)} of 5 in your ${phase} phase.`,
    });
  }

  // Best training window: highest share of "strong" workouts, at least 4 workouts in the phase.
  const tally = strongWorkoutsByPhase(cycles, workouts);
  let best: { phase: Phase; share: number } | null = null;
  for (const phase of PHASES) {
    const { total, strong } = tally[phase];
    if (total < MIN_WORKOUTS_IN_PHASE) continue;
    const share = strong / total;
    if (share > 0 && (best === null || share > best.share)) best = { phase, share };
  }
  if (best) {
    insights.push({
      kind: "best-training-window",
      phase: best.phase,
      text: `You often feel strongest training in your ${best.phase} phase (${Math.round(best.share * 100)}% of workouts felt strong).`,
    });
  }

  return insights;
}
