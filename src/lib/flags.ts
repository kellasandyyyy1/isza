import type { DailyLog, DismissedFlag, Period, Profile } from "@/db/schema";
import {
  computeCycleStats,
  daysBetween,
  menstrualEndDay,
  periodDuration,
  shiftDate,
  sortPeriods,
  type CycleState,
} from "./cycle";

export type FlagId =
  | "cycle-length"
  | "long-period"
  | "heavy-flow"
  | "severe-pain"
  | "missed-period"
  | "spotting-between";

export interface HealthFlag {
  id: FlagId;
  title: string;
  body: string;
}

export interface FlagsInput {
  cycle: CycleState;
  periods: Period[];
  logs: DailyLog[];
  profile: Profile | null;
  dismissedFlags: DismissedFlag[];
  // "yyyy-MM-dd"
  today: string;
}

const SHORT_CYCLE = 21;
const LONG_CYCLE = 35;
const LONG_PERIOD_DAYS = 7;
const HEAVY_FLOW_DAYS = 2;
const SEVERE_PAIN_CYCLES = 2;
const SEVERE_PAIN_WINDOW = 3;
const MISSED_PERIOD_DAYS = 60;
const SPOTTING_DAYS = 3;

const DOCTOR = "Consider talking to a doctor.";

const FLAG_TEXT: Record<Exclude<FlagId, "cycle-length">, Omit<HealthFlag, "id">> = {
  "long-period": {
    title: "Your last period was long",
    body: `Periods longer than 7 days can have many causes. ${DOCTOR}`,
  },
  "heavy-flow": {
    title: "Very heavy flow on several days",
    body: `Very heavy bleeding may leave you tired or low on iron. ${DOCTOR}`,
  },
  "severe-pain": {
    title: "Strong cramps in recent cycles",
    body: `Severe cramps that keep coming back are worth checking. ${DOCTOR}`,
  },
  "missed-period": {
    title: "No period in 60 days",
    body: `A long gap can have many causes, like stress or pregnancy. ${DOCTOR}`,
  },
  "spotting-between": {
    title: "Bleeding between periods",
    body: `Spotting between periods can happen for many reasons. ${DOCTOR}`,
  },
};

const CYCLE_LENGTH_TEXT = {
  short: {
    title: "Your last two cycles were short",
    body: `Cycles shorter than 21 days can have many causes. ${DOCTOR}`,
  },
  long: {
    title: "Your last two cycles were long",
    body: `Cycles longer than 35 days can have many causes. ${DOCTOR}`,
  },
};

// Flags that depend on cycle timing. Skipped in hormonal mode.
const CYCLE_BASED: FlagId[] = ["cycle-length", "missed-period", "spotting-between"];

const countDays = (logs: DailyLog[], from: string, to: string, matches: (log: DailyLog) => boolean) =>
  logs.filter((log) => log.date >= from && log.date <= to && matches(log)).length;

export function computeFlags({ cycle, periods, logs, profile, dismissedFlags, today }: FlagsInput): HealthFlag[] {
  const sorted = sortPeriods(periods);
  const latest = sorted.at(-1);
  if (!latest) return [];

  const stats = computeCycleStats(sorted, profile);
  const flags: HealthFlag[] = [];

  // cycle-length: the last 2 valid cycles are both under 21 or both over 35 days.
  const lastTwo = stats.validLengths.slice(-2);
  if (lastTwo.length === 2) {
    if (lastTwo.every((length) => length < SHORT_CYCLE)) flags.push({ id: "cycle-length", ...CYCLE_LENGTH_TEXT.short });
    if (lastTwo.every((length) => length > LONG_CYCLE)) flags.push({ id: "cycle-length", ...CYCLE_LENGTH_TEXT.long });
  }

  // long-period: the latest period has an end date and lasted more than 7 days.
  if ((periodDuration(latest) ?? 0) > LONG_PERIOD_DAYS) flags.push({ id: "long-period", ...FLAG_TEXT["long-period"] });

  // heavy-flow: "very-heavy" on 2 or more days of the latest period (up to today if it has no end date).
  const periodEnd = latest.endDate ?? today;
  if (countDays(logs, latest.startDate, periodEnd, (log) => log.bleeding === "very-heavy") >= HEAVY_FLOW_DAYS) {
    flags.push({ id: "heavy-flow", ...FLAG_TEXT["heavy-flow"] });
  }

  // severe-pain: cramps severity 3 in 2 or more of the last 3 cycles, the current cycle included.
  const cycleWindows = sorted.map((period, index) => ({
    from: period.startDate,
    to: index + 1 < sorted.length ? shiftDate(sorted[index + 1].startDate, -1) : today,
  }));
  const painfulCycles = cycleWindows
    .slice(-SEVERE_PAIN_WINDOW)
    .filter(
      ({ from, to }) =>
        countDays(logs, from, to, (log) => log.symptoms.some((s) => s.key === "cramps" && s.severity === 3)) > 0,
    ).length;
  if (painfulCycles >= SEVERE_PAIN_CYCLES) flags.push({ id: "severe-pain", ...FLAG_TEXT["severe-pain"] });

  // missed-period: 60 or more days since the latest period start.
  if (daysBetween(latest.startDate, today) >= MISSED_PERIOD_DAYS) {
    flags.push({ id: "missed-period", ...FLAG_TEXT["missed-period"] });
  }

  // spotting-between: bleeding on 3 or more days after the menstrual phase in the current cycle.
  const firstDayAfterMenstrual = shiftDate(latest.startDate, menstrualEndDay(latest, stats.avgPeriodLength));
  if (countDays(logs, firstDayAfterMenstrual, today, (log) => log.bleeding !== "none") >= SPOTTING_DAYS) {
    flags.push({ id: "spotting-between", ...FLAG_TEXT["spotting-between"] });
  }

  const dismissed = new Set(dismissedFlags.filter((flag) => flag.until > today).map((flag) => flag.id));
  return flags.filter(
    (flag) => !dismissed.has(flag.id) && !(cycle.mode === "hormonal" && CYCLE_BASED.includes(flag.id)),
  );
}
