import type { DailyLog, Mood, Period, Profile, SymptomKey, Workout } from "@/db/schema";
import { moodSchema, symptomKeySchema } from "@/db/schema";
import { PHASES, completedCycles, phaseOnDate, shiftDate, type CompletedCycle, type CycleState, type Phase } from "./cycle";

export type InsightKind = "symptom-pattern" | "energy-by-phase" | "best-training-window";

export interface Insight {
  kind: InsightKind;
  phase: Phase;
  text: string;
  // Symptom patterns only: which symptom, in how many of how many recent cycles.
  pattern?: { symptom: SymptomKey; count: number; of: number };
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

// Unlock progress

export interface InsightProgress {
  completedCycles: number;
  needed: typeof MIN_COMPLETED_CYCLES;
  // Estimated day the first patterns can appear. Null once unlocked, or without a prediction.
  unlockDate: string | null;
}

// validLengths and avgCycleLength come from computeCycleStats, so the date follows the engine's prediction:
// with no completed cycle the second period after the next one, with one completed cycle the next period.
export function getInsightProgress(
  cycleState: CycleState,
  validLengths: number[],
  avgCycleLength: number,
): InsightProgress {
  const completed = validLengths.length;
  const next = cycleState.nextPeriod?.start ?? null;
  const unlockDate =
    completed >= MIN_COMPLETED_CYCLES || next === null
      ? null
      : completed === 0
        ? shiftDate(next, Math.round(avgCycleLength))
        : next;
  return { completedCycles: completed, needed: MIN_COMPLETED_CYCLES, unlockDate };
}

// "This cycle so far": counts of her own logs. No interpretation, comparison or phase link.

const TOP_SYMPTOMS = 3;
// Below this many logged moods the row names them instead of saying which is most common.
export const MIN_MOODS_FOR_MOSTLY = 3;

export interface CycleSymptomCount {
  key: SymptomKey;
  // Days it was logged.
  days: number;
  // The strongest severity logged, 1 to 3. Breaks ties in the order.
  maxSeverity: number;
}

export interface CurrentCycleSummary {
  checkInCount: number;
  // To one decimal, null when no check-in has an energy value.
  avgEnergy: number | null;
  moodCounts: Record<Mood, number>;
  // Up to 3, by days logged, then by the strongest severity, then in the check-in's symptom order.
  topSymptoms: CycleSymptomCount[];
  // Symptoms logged beyond the top 3, for "+2 more".
  moreSymptoms: number;
  // Days with any bleeding, spotting included.
  bleedingDays: number;
  workoutCount: number;
}

// Check-ins and workouts since the current cycle started. Without a period, every one of them.
export function getCurrentCycleSummary(logs: DailyLog[], workouts: Workout[], cycleState: CycleState): CurrentCycleSummary {
  const start = cycleState.cycleStart;
  const inCycle = logs.filter((log) => start === null || log.date >= start);
  const energies = inCycle.flatMap((log) => (log.energy === null ? [] : [log.energy]));

  const moodCounts = Object.fromEntries(moodSchema.options.map((mood) => [mood, 0])) as Record<Mood, number>;
  for (const log of inCycle) if (log.mood !== null) moodCounts[log.mood] += 1;

  const symptoms = new Map<SymptomKey, CycleSymptomCount>();
  for (const log of inCycle) {
    for (const { key, severity } of log.symptoms) {
      const current = symptoms.get(key) ?? { key, days: 0, maxSeverity: 0 };
      symptoms.set(key, { key, days: current.days + 1, maxSeverity: Math.max(current.maxSeverity, severity) });
    }
  }
  const order = symptomKeySchema.options;
  const sorted = [...symptoms.values()].sort(
    (a, b) => b.days - a.days || b.maxSeverity - a.maxSeverity || order.indexOf(a.key) - order.indexOf(b.key),
  );

  return {
    checkInCount: inCycle.length,
    avgEnergy: energies.length > 0 ? roundToTenth(energies.reduce((sum, value) => sum + value, 0) / energies.length) : null,
    moodCounts,
    topSymptoms: sorted.slice(0, TOP_SYMPTOMS),
    moreSymptoms: Math.max(sorted.length - TOP_SYMPTOMS, 0),
    bleedingDays: inCycle.filter((log) => log.bleeding !== "none").length,
    workoutCount: workouts.filter((workout) => start === null || workout.date >= start).length,
  };
}

// The mood row's words: "Mostly okay" from 3 logged moods, else the moods named: "Logged: good, low".
// Null when no mood is logged. A tie goes to the first mood in the check-in's order.
export function moodSummaryText(moodCounts: Record<Mood, number>): string | null {
  const logged = moodSchema.options.filter((mood) => moodCounts[mood] > 0);
  if (logged.length === 0) return null;
  const total = logged.reduce((sum, mood) => sum + moodCounts[mood], 0);
  if (total < MIN_MOODS_FOR_MOSTLY) return `Logged: ${logged.join(", ")}`;
  const top = logged.reduce((best, mood) => (moodCounts[mood] > moodCounts[best] ? mood : best));
  return `Mostly ${top}`;
}

// The symptom chips: "Cramps, 3 days" for each of the top 3, then "+2 more" when there are others.
export function symptomChipLabels(topSymptoms: CycleSymptomCount[], moreSymptoms: number): string[] {
  const chips = topSymptoms.map(({ key, days }) => `${SYMPTOM_LABELS[key]}, ${days} ${days === 1 ? "day" : "days"}`);
  return moreSymptoms > 0 ? [...chips, `+${moreSymptoms} more`] : chips;
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
          pattern: { symptom: key, count, of: recentCycles.length },
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
