import type { WorkoutType } from "@/db/schema";
import type { Phase } from "@/lib/cycle";
import type { ReadinessBand } from "@/lib/readiness";

// The workout types on the Plan tab's swap row. Sport is only for logging.
export type PlanWorkoutType = Exclude<WorkoutType, "sport">;

export interface SuggestedSession {
  type: PlanWorkoutType;
  title: string;
  durationMin: number;
  // Out of 10, as shown: "7 to 8" or "8".
  effort: string;
}

export interface WorkoutPreset {
  durationMin: number;
  effort: number;
}

// The session suggested for each readiness band, with a second choice.
export const suggestedByBand: Record<ReadinessBand, { main: SuggestedSession; alt: SuggestedSession }> = {
  Go: {
    main: { type: "strength", title: "Heavy strength", durationMin: 45, effort: "7 to 8" },
    alt: { type: "hiit", title: "Intervals", durationMin: 25, effort: "8" },
  },
  Steady: {
    main: { type: "cardio", title: "Steady cardio", durationMin: 35, effort: "5 to 6" },
    alt: { type: "strength", title: "Technique strength", durationMin: 35, effort: "6" },
  },
  Rest: {
    main: { type: "mobility", title: "Mobility and a walk", durationMin: 20, effort: "2 to 3" },
    alt: { type: "rest", title: "Full rest", durationMin: 0, effort: "0" },
  },
};

// What the card shows after a swap chip is chosen.
export const presetByType: Record<PlanWorkoutType, WorkoutPreset> = {
  strength: { durationMin: 45, effort: 7 },
  hiit: { durationMin: 25, effort: 8 },
  cardio: { durationMin: 35, effort: 5 },
  mobility: { durationMin: 20, effort: 3 },
  rest: { durationMin: 0, effort: 0 },
};

// One extra line on the suggested session card. Late luteal wins over the plain luteal phase.
export function phaseNote(phase: Phase | null, isLateLuteal: boolean): string | null {
  if (isLateLuteal) return "You may want to lower the intensity a notch.";
  if (phase === "ovulatory") return "Warm up for 10 minutes first.";
  return null;
}
