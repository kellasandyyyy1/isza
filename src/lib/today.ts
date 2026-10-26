import { format, parseISO } from "date-fns";
import type { GuidanceKey } from "@/content/guidance";
import type { DailyLog, DismissedFlag, Period, Profile } from "@/db/schema";
import { clamp } from "./clamp";
import { computeCycleState, computeCycleStats, daysBetween, shiftDate, sortPeriods, type CycleState } from "./cycle";
import { computeFlags, type HealthFlag } from "./flags";
import { computeReadiness, type Readiness, type ReadinessBand } from "./readiness";
import { periodPrepText } from "./reminders";

export type TodayMood = "cheer" | "calm" | "tired";

export const MOOD_BY_BAND: Record<ReadinessBand, TodayMood> = { Go: "cheer", Steady: "calm", Rest: "tired" };

export interface TodayInput {
  profile: Profile | null;
  periods: Period[];
  logs: DailyLog[];
  dismissedFlags: DismissedFlag[];
  now: Date;
}

export interface TodayView {
  today: string;
  greeting: string;
  dateLabel: string;
  cycle: CycleState;
  readiness: Readiness;
  mood: TodayMood;
  flags: HealthFlag[];
  // Ring value: cycle day as a share of the average cycle length. Null without data.
  ringPercent: number | null;
  // "Period in about 5 days", with the date range as a caption under it.
  nextPeriodText: string | null;
  nextPeriodRange: string | null;
  // The one-tap period pill. Null when it should not show.
  periodAction: PeriodQuickAction | null;
  guidanceKey: GuidanceKey;
  todayLog: DailyLog | null;
  // The period-prep card text, only 2 days before the predicted period.
  periodPrep: string | null;
}

const PERIOD_PREP_DAYS = 2;

export function greetingFor(hour: number, name: string | null): string {
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

const WEEKS_FROM_DAYS = 14;
const MAX_FRIENDLY_DAYS = 90;
const DAYS_PER_WEEK = 7;

// The main next-period line: "Period expected today", "Period in about 5 days", "Period in about 3 weeks"
// or "Period may be late". Null without a prediction, or when it is more than 90 days away.
export function formatNextPeriod(
  nextPeriod: CycleState["nextPeriod"],
  today: string,
  status: CycleState["status"],
): string | null {
  if (status === "late") return "Period may be late";
  if (!nextPeriod) return null;
  const days = daysBetween(today, nextPeriod.start);
  if (days <= 0) return "Period expected today";
  if (days === 1) return "Period expected tomorrow";
  if (days < WEEKS_FROM_DAYS) return `Period in about ${days} days`;
  if (days <= MAX_FRIENDLY_DAYS) return `Period in about ${Math.round(days / DAYS_PER_WEEK)} weeks`;
  return null;
}

// The predicted range under the main line: "Nov 3 to 6" or "Oct 30 to Nov 2".
export function formatPeriodRange(nextPeriod: CycleState["nextPeriod"]): string | null {
  if (!nextPeriod) return null;
  const earliest = parseISO(nextPeriod.earliest);
  const latest = parseISO(nextPeriod.latest);
  const sameMonth = format(earliest, "yyyy-MM") === format(latest, "yyyy-MM");
  return `${format(earliest, "MMM d")} to ${format(latest, sameMonth ? "d" : "MMM d")}`;
}

export type PeriodQuickAction = { kind: "start" } | { kind: "end"; periodId: number };

const END_PROMPT_AFTER_DAYS = 3;

// The one-tap period pill under the hero. Start: no open period, and the period is late or due
// from 1 day before the earliest predicted start. End: the open period started 3 or more days ago.
export function periodQuickAction(periods: Period[], cycle: CycleState, today: string): PeriodQuickAction | null {
  if (cycle.mode === "no-data") return null;
  const latest = sortPeriods(periods).at(-1);
  if (latest && latest.endDate === null) {
    const started = daysBetween(latest.startDate, today);
    return started >= END_PROMPT_AFTER_DAYS && latest.id !== undefined ? { kind: "end", periodId: latest.id } : null;
  }
  const due = cycle.status === "late" || (cycle.nextPeriod !== null && today >= shiftDate(cycle.nextPeriod.earliest, -1));
  return due ? { kind: "start" } : null;
}

export function cycleProgressPercent(cycleDay: number, avgCycleLength: number): number {
  return Math.round(clamp((cycleDay / avgCycleLength) * 100, 0, 100));
}

export function buildTodayView({ profile, periods, logs, dismissedFlags, now }: TodayInput): TodayView {
  const today = format(now, "yyyy-MM-dd");
  const yesterday = shiftDate(today, -1);
  const cycle = computeCycleState({ periods, profile, logs, today });
  const todayLog = logs.find((log) => log.date === today) ?? null;
  const readiness = computeReadiness({
    cycle,
    todayLog,
    yesterdayLog: logs.find((log) => log.date === yesterday) ?? null,
    history: { periods, logs, profile },
  });
  const { avgCycleLength } = computeCycleStats(periods, profile);

  return {
    today,
    greeting: greetingFor(now.getHours(), profile?.name ?? null),
    dateLabel: format(now, "EEE, MMM d"),
    cycle,
    readiness,
    mood: MOOD_BY_BAND[readiness.band],
    flags: computeFlags({ cycle, periods, logs, profile, dismissedFlags, today }),
    ringPercent: cycle.cycleDay === null ? null : cycleProgressPercent(cycle.cycleDay, avgCycleLength),
    nextPeriodText: formatNextPeriod(cycle.nextPeriod, today, cycle.status),
    nextPeriodRange: cycle.status === "late" ? null : formatPeriodRange(cycle.nextPeriod),
    periodAction: periodQuickAction(periods, cycle, today),
    guidanceKey: cycle.phase ?? "neutral",
    todayLog,
    periodPrep:
      cycle.nextPeriod && daysBetween(today, cycle.nextPeriod.start) === PERIOD_PREP_DAYS
        ? periodPrepText(profile?.discreetMode ?? false)
        : null,
  };
}
