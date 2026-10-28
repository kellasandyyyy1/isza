import { format, parseISO } from "date-fns";
import type { GuidanceKey } from "@/content/guidance";
import type { DailyLog, DismissedFlag, Period, Profile } from "@/db/schema";
import {
  computeCycleState,
  computeCycleStats,
  daysBetween,
  HISTORY_SIZE,
  shiftDate,
  sortPeriods,
  type CycleState,
} from "./cycle";
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
  // "Period in about 5 days" or "Period is 3 days late", with the date range as a caption under it.
  nextPeriodText: string | null;
  nextPeriodRange: string | null;
  // How sure the range is, in plain words: "based on 4 cycles" or "estimate, keep logging".
  nextPeriodBasis: string | null;
  // Days past the latest predicted start, while the period is late. Null otherwise.
  lateDays: number | null;
  // Caption lines under the late line: facts only, never an alert.
  lateNotes: string[];
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

// From this many days late, the late state adds the doctor line.
export const LATE_DOCTOR_DAYS = 45;
export const LATE_NOTE = "Cycles vary for many reasons. You can log it as soon as it starts.";
export const LATE_DOCTOR_NOTE = "If your period has not come and you are not sure why, consider talking to a doctor.";

// The late line. Days count from the latest day of the predicted range, the day after which it is late.
export function formatLatePeriod(days: number): string {
  return days === 1 ? "Period is 1 day late" : `Period is ${days} days late`;
}

export function latePeriodNotes(days: number): string[] {
  return days >= LATE_DOCTOR_DAYS ? [LATE_NOTE, LATE_DOCTOR_NOTE] : [LATE_NOTE];
}

// The confidence caption after the range. Counts the cycles the average uses, at most the last 6.
export function formatPeriodBasis(validLengthCount: number): string {
  if (validLengthCount < 2) return "estimate, keep logging";
  return `based on ${Math.min(validLengthCount, HISTORY_SIZE)} cycles`;
}

export type PeriodQuickAction = { kind: "start" } | { kind: "end"; periodId: number };

// How much room Today leaves the plan cards: "roomy" for full cards, "light" for one extra row (full cards on tall
// phones, title rows on shorter ones), "heavy" for two or more, where only title rows fit without scrolling.
export type PlanCardRoom = "roomy" | "light" | "heavy";

// Extra rows are the period pill, the health flag chip, the late notes, the low supply chip and the prep card.
export function planCardRoom(extraRows: number): PlanCardRoom {
  if (extraRows <= 0) return "roomy";
  return extraRows === 1 ? "light" : "heavy";
}

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
  const { validLengths } = computeCycleStats(periods, profile);
  const lateDays = cycle.status === "late" && cycle.nextPeriod ? daysBetween(cycle.nextPeriod.latest, today) : null;

  return {
    today,
    greeting: greetingFor(now.getHours(), profile?.name ?? null),
    dateLabel: format(now, "EEE, MMM d"),
    cycle,
    readiness,
    mood: MOOD_BY_BAND[readiness.band],
    flags: computeFlags({ cycle, periods, logs, profile, dismissedFlags, today }),
    nextPeriodText: lateDays !== null ? formatLatePeriod(lateDays) : formatNextPeriod(cycle.nextPeriod, today, cycle.status),
    nextPeriodRange: cycle.status === "late" ? null : formatPeriodRange(cycle.nextPeriod),
    nextPeriodBasis: cycle.nextPeriod && cycle.status !== "late" ? formatPeriodBasis(validLengths.length) : null,
    lateDays,
    lateNotes: lateDays !== null ? latePeriodNotes(lateDays) : [],
    periodAction: periodQuickAction(periods, cycle, today),
    guidanceKey: cycle.phase ?? "neutral",
    todayLog,
    periodPrep:
      cycle.nextPeriod && daysBetween(today, cycle.nextPeriod.start) === PERIOD_PREP_DAYS
        ? periodPrepText(profile?.discreetMode ?? false)
        : null,
  };
}
