import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import { z } from "zod";
import { isoDateSchema, workoutSchema, type Period, type Profile, type Workout, type WorkoutType } from "@/db/schema";
import { clamp } from "./clamp";
import { PHASES, completedCycles, phaseOnDate, type Phase } from "./cycle";
import { strongWorkoutsByPhase } from "./insights";
import type { ReadinessBand } from "./readiness";

export const DURATION_RANGE = { min: 5, max: 240, step: 5, initial: 45 } as const;
export const EFFORT_RANGE = { min: 1, max: 10, initial: 5 } as const;
export const WORKOUT_NOTE_MAX_LENGTH = 140;
export const LOG_PAGE_SIZE = 5;
const MIN_CYCLES_WITH_WORKOUTS = 2;

// The log workout form's limits, tighter than the stored workout.
export const workoutFormSchema = workoutSchema.omit({ id: true }).extend({
  date: isoDateSchema,
  durationMin: z.number().int().min(DURATION_RANGE.min).max(DURATION_RANGE.max).multipleOf(DURATION_RANGE.step),
  rpe: z.number().int().min(EFFORT_RANGE.min).max(EFFORT_RANGE.max),
  note: z.string().max(WORKOUT_NOTE_MAX_LENGTH).nullable(),
});
export type WorkoutForm = z.infer<typeof workoutFormSchema>;

export function stepDuration(minutes: number, direction: 1 | -1): number {
  return clamp(minutes + direction * DURATION_RANGE.step, DURATION_RANGE.min, DURATION_RANGE.max);
}

// Newest first. Same-day workouts: the most recently added first.
export function newestFirst(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0));
}

// Plan tab

// The Log workout sheet's starting values from a suggested session. A range like "7 to 8" starts
// at its lower end, and values outside the form's ranges move to the nearest allowed value.
export function sessionPrefill(durationMin: number, effort: string | number): { durationMin: number; rpe: number } {
  const lowEffort = typeof effort === "number" ? effort : Number.parseInt(effort, 10);
  const roundedDuration = Math.round(durationMin / DURATION_RANGE.step) * DURATION_RANGE.step;
  return {
    durationMin: clamp(roundedDuration, DURATION_RANGE.min, DURATION_RANGE.max),
    rpe: clamp(Number.isNaN(lowEffort) ? EFFORT_RANGE.initial : lowEffort, EFFORT_RANGE.min, EFFORT_RANGE.max),
  };
}

// Strength and HIIT on a Rest day get a calm note, never a block.
export function prefersLighter(band: ReadinessBand, type: WorkoutType): boolean {
  return band === "Rest" && (type === "strength" || type === "hiit");
}

// Monday to Sunday of the week that holds today, as "yyyy-MM-dd".
export function weekDates(today: string): string[] {
  const monday = startOfWeek(parseISO(today), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => format(addDays(monday, index), "yyyy-MM-dd"));
}

// "today", "yesterday", "2 days ago". Future dates count as today.
export function relativeDay(date: string, today: string): string {
  const days = differenceInCalendarDays(parseISO(today), parseISO(date));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

// The newest workout up to today, or null.
export function lastWorkout(workouts: Workout[], today: string): Workout | null {
  return newestFirst(workouts.filter((workout) => workout.date <= today))[0] ?? null;
}

export interface StrongShare {
  phase: Phase;
  total: number;
  strong: number;
  // 0 to 100, rounded. Null when the phase has no workouts.
  percent: number | null;
}

export interface TrainingProgress {
  // Completed cycles that contain at least one workout.
  cyclesWithWorkouts: number;
  available: boolean;
  shares: StrongShare[];
}

// The Progress tab needs 2 or more completed cycles with workouts.
export function trainingProgress(periods: Period[], workouts: Workout[], profile: Profile | null): TrainingProgress {
  const cycles = completedCycles(periods, profile);
  const cycleIndexes = new Set(
    workouts.map((workout) => phaseOnDate(cycles, workout.date)?.cycleIndex).filter((index) => index !== undefined),
  );
  const tally = strongWorkoutsByPhase(cycles, workouts);
  return {
    cyclesWithWorkouts: cycleIndexes.size,
    available: cycleIndexes.size >= MIN_CYCLES_WITH_WORKOUTS,
    shares: PHASES.map((phase) => {
      const { total, strong } = tally[phase];
      return { phase, total, strong, percent: total === 0 ? null : Math.round((strong / total) * 100) };
    }),
  };
}
