import { completedCycles, computeCycleState } from "@/lib/cycle";
import { computeInsights } from "@/lib/insights";
import { getValidationCard, type ValidationCard } from "@/lib/validation";
import { getProfile, getValidationSettings, listLogs, listPeriods } from "@/db/repo";
import type { DailyLog } from "@/db/schema";

const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

// Reads the saved data fresh after a check-in and asks the pure rules for a card.
// Only for today's check-in: the cycle state is today's, so a past day would be read in the wrong phase.
export async function findValidationCard(savedLog: DailyLog, today: string): Promise<ValidationCard | null> {
  if (savedLog.date !== today) return null;
  const [profile, periods, logs, settings] = await Promise.all([
    getProfile(),
    listPeriods(),
    listLogs(ALL_DATES.from, ALL_DATES.to),
    getValidationSettings(),
  ]);
  return getValidationCard({
    cycleState: computeCycleState({ periods, profile, logs, today }),
    todayLog: savedLog,
    logs,
    // Workouts only feed the training insight, which the cards never use.
    insights: computeInsights({ periods, logs, workouts: [], profile }),
    cycles: completedCycles(periods, profile),
    settings,
    today,
  });
}
