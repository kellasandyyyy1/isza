import type { Period, Profile } from "@/db/schema";
import { completedCycles, computeCycleState, computeCycleStats, periodDuration, sortPeriods } from "./cycle";

const HISTORY_SIZE = 6;
const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export interface CycleSummary {
  // Rounded to one decimal.
  avgCycleLength: number;
  avgPeriodLength: number;
  // Shortest and longest of the recent valid lengths. Null with fewer than 2.
  usualRange: { min: number; max: number } | null;
  confidence: "high" | "medium" | "low";
}

export function cycleSummary(periods: Period[], profile: Profile | null, today: string): CycleSummary {
  const stats = computeCycleStats(periods, profile);
  const recent = stats.validLengths.slice(-HISTORY_SIZE);
  return {
    avgCycleLength: roundToTenth(stats.avgCycleLength),
    avgPeriodLength: roundToTenth(stats.avgPeriodLength),
    usualRange: recent.length >= 2 ? { min: Math.min(...recent), max: Math.max(...recent) } : null,
    confidence: computeCycleState({ periods, profile, logs: [], today }).confidence,
  };
}

export interface CycleBar {
  startDate: string;
  length: number;
  // Logged period length. Null when the period has no end date.
  periodLength: number | null;
}

// The last completed cycles, oldest first.
export function recentCycles(periods: Period[], profile: Profile | null, count = HISTORY_SIZE): CycleBar[] {
  const byStart = new Map(sortPeriods(periods).map((period) => [period.startDate, period]));
  return completedCycles(periods, profile)
    .slice(-count)
    .map((cycle) => {
      const period = byStart.get(cycle.startDate);
      return { startDate: cycle.startDate, length: cycle.length, periodLength: period ? periodDuration(period) : null };
    });
}
