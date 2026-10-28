import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { DailyLog, Period, Profile } from "@/db/schema";
import { clamp } from "./clamp";

export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";
export const PHASES: Phase[] = ["menstrual", "follicular", "ovulatory", "luteal"];

export type CycleMode = "standard" | "hormonal" | "irregular" | "no-data";

export interface CycleState {
  mode: CycleMode;
  cycleDay: number | null;
  // The start date of the current cycle: the latest period start. Null without data.
  cycleStart: string | null;
  phase: Phase | null;
  isLateLuteal: boolean;
  nextPeriod: { start: string; earliest: string; latest: string } | null;
  ovulationDay: number | null;
  fertileWindow: { start: string; end: string } | null;
  confidence: "high" | "medium" | "low";
  // True while fewer than 2 valid cycle lengths exist, so the average is a default or her own guess.
  cycleLengthIsEstimate: boolean;
  // Rules 2 and 14, for the cycle ring: the average cycle length, the last menstrual cycle day (logged end,
  // else the average period length), and how many days of the current period are logged (through today while
  // it has no end date). Null without data.
  avgCycleLength: number | null;
  menstrualEnd: number | null;
  periodLoggedDays: number | null;
  status: "ok" | "late" | "no-data";
}

export interface CycleInput {
  periods: Period[];
  profile: Profile | null;
  logs: DailyLog[];
  // "yyyy-MM-dd"
  today: string;
}

const MIN_VALID_CYCLE_LENGTH = 15;
const MAX_VALID_CYCLE_LENGTH = 90;
export const HISTORY_SIZE = 6;
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const LUTEAL_PHASE_DAYS = 14;
const MIN_FOLLICULAR_GAP = 2;
const LATE_LUTEAL_DAYS = 5;
const DEFAULT_RANGE_DAYS = 3;
const MAX_RANGE_DAYS = 7;
const IRREGULAR_SD = 7;
const IRREGULAR_RECENT_COUNT = 3;
const REGULAR_MIN_LENGTH = 21;
const REGULAR_MAX_LENGTH = 35;
const HIGH_CONFIDENCE_SD = 3;
const BBT_BASELINE_DAYS = 6;
const BBT_HIGH_DAYS = 3;
const BBT_SHIFT_CELSIUS = 0.2;
// Absorbs floating point error so a rise of exactly 0.2 counts.
const BBT_EPSILON = 1e-9;
const HORMONAL_CONTRACEPTION: Profile["contraception"][] = ["hormonal", "iud-hormonal"];

// Date helpers. All dates are "yyyy-MM-dd".

export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from));
}

export function shiftDate(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Population standard deviation. 0 for fewer than 2 values.
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

export function sortPeriods(periods: Period[]): Period[] {
  return [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function isValidCycleLength(length: number): boolean {
  return length >= MIN_VALID_CYCLE_LENGTH && length <= MAX_VALID_CYCLE_LENGTH;
}

// Rule 1: days between consecutive period starts, oldest first, invalid lengths included.
export function cycleLengths(periods: Period[]): number[] {
  const sorted = sortPeriods(periods);
  return sorted.slice(1).map((period, index) => daysBetween(sorted[index].startDate, period.startDate));
}

export function periodDuration(period: Period): number | null {
  return period.endDate === null ? null : daysBetween(period.startDate, period.endDate) + 1;
}

export interface CycleStats {
  // Every valid length, oldest first.
  validLengths: number[];
  avgCycleLength: number;
  sd: number;
  avgPeriodLength: number;
}

// Rules 2 to 4.
export function computeCycleStats(periods: Period[], profile: Profile | null): CycleStats {
  const validLengths = cycleLengths(periods).filter(isValidCycleLength);
  const recentLengths = validLengths.slice(-HISTORY_SIZE);
  const durations = sortPeriods(periods)
    .map(periodDuration)
    .filter((duration): duration is number => duration !== null)
    .slice(-HISTORY_SIZE);

  return {
    validLengths,
    avgCycleLength:
      recentLengths.length > 0 ? mean(recentLengths) : (profile?.typicalCycleLength ?? DEFAULT_CYCLE_LENGTH),
    sd: standardDeviation(recentLengths),
    avgPeriodLength:
      durations.length > 0 ? mean(durations) : (profile?.typicalPeriodLength ?? DEFAULT_PERIOD_LENGTH),
  };
}

// Rule 14: the last menstrual day is the logged end date, else round(avgPeriodLength).
export function menstrualEndDay(period: Period, avgPeriodLength: number): number {
  return periodDuration(period) ?? Math.round(avgPeriodLength);
}

// Rule 12: round(cycle length) minus 14, never earlier than round(avgPeriodLength) plus 2.
export function predictedOvulationDay(cycleLength: number, avgPeriodLength: number): number {
  return Math.max(Math.round(cycleLength) - LUTEAL_PHASE_DAYS, Math.round(avgPeriodLength) + MIN_FOLLICULAR_GAP);
}

// Rule 14. Checked in order, so the menstrual phase wins if phases overlap.
export function phaseForCycleDay(cycleDay: number, menstrualEnd: number, ovulationDay: number): Phase {
  if (cycleDay <= menstrualEnd) return "menstrual";
  if (cycleDay <= ovulationDay - 2) return "follicular";
  if (cycleDay <= ovulationDay + 1) return "ovulatory";
  return "luteal";
}

function logsInRange(logs: DailyLog[], from: string, to: string): DailyLog[] {
  return logs.filter((log) => log.date >= from && log.date <= to).sort((a, b) => a.date.localeCompare(b.date));
}

// Rule 12a: cycle day of the first positive LH test in the cycle, or null.
export function firstPositiveLhDay(logs: DailyLog[], cycleStart: string, today: string): number | null {
  const positive = logsInRange(logs, cycleStart, today).find((log) => log.lhTest === "positive");
  return positive ? daysBetween(cycleStart, positive.date) + 1 : null;
}

// Rule 12b: cycle day of the first of 3 consecutive days that are each at least 0.2 C above
// the mean of the 6 days right before them. All 9 days must have a BBT logged.
export function detectBbtShift(logs: DailyLog[], cycleStart: string, today: string): number | null {
  const bbtByDate = new Map<string, number>();
  for (const log of logsInRange(logs, cycleStart, today)) {
    if (log.bbt !== null) bbtByDate.set(log.date, log.bbt);
  }

  const lastCycleDay = daysBetween(cycleStart, today) + 1;
  for (let firstHigh = BBT_BASELINE_DAYS + 1; firstHigh + BBT_HIGH_DAYS - 1 <= lastCycleDay; firstHigh++) {
    const readings = (fromDay: number, count: number) =>
      Array.from({ length: count }, (_, index) => bbtByDate.get(shiftDate(cycleStart, fromDay - 1 + index)));
    const baseline = readings(firstHigh - BBT_BASELINE_DAYS, BBT_BASELINE_DAYS);
    const high = readings(firstHigh, BBT_HIGH_DAYS);
    if (baseline.some((value) => value === undefined) || high.some((value) => value === undefined)) continue;

    const threshold = mean(baseline as number[]) + BBT_SHIFT_CELSIUS - BBT_EPSILON;
    if ((high as number[]).every((value) => value >= threshold)) return firstHigh;
  }
  return null;
}

const NO_DATA_STATE: CycleState = {
  mode: "no-data",
  cycleDay: null,
  cycleStart: null,
  phase: null,
  isLateLuteal: false,
  nextPeriod: null,
  ovulationDay: null,
  fertileWindow: null,
  confidence: "low",
  cycleLengthIsEstimate: true,
  avgCycleLength: null,
  menstrualEnd: null,
  periodLoggedDays: null,
  status: "no-data",
};

export function computeCycleState({ periods, profile, logs, today }: CycleInput): CycleState {
  const sorted = sortPeriods(periods);
  const latest = sorted.at(-1);
  // Rule 5.
  if (!latest) return NO_DATA_STATE;

  const stats = computeCycleStats(sorted, profile);
  const validCount = stats.validLengths.length;

  // Rule 6.
  const cycleDay = daysBetween(latest.startDate, today) + 1;

  // Rule 7.
  const rangeDays = validCount >= 2 ? clamp(Math.round(stats.sd), 1, MAX_RANGE_DAYS) : DEFAULT_RANGE_DAYS;
  const nextStart = shiftDate(latest.startDate, Math.round(stats.avgCycleLength));
  const nextPeriod = {
    start: nextStart,
    earliest: shiftDate(nextStart, -rangeDays),
    latest: shiftDate(nextStart, rangeDays),
  };

  // Rule 8.
  const status: CycleState["status"] = today > nextPeriod.latest ? "late" : "ok";

  // Rule 15.
  const confidence: CycleState["confidence"] =
    validCount >= 3 && stats.sd <= HIGH_CONFIDENCE_SD
      ? "high"
      : validCount >= 2 || profile?.typicalCycleLength != null
        ? "medium"
        : "low";

  const cycleLengthIsEstimate = validCount < 2;
  const menstrualEnd = menstrualEndDay(latest, stats.avgPeriodLength);
  const ringFields = {
    avgCycleLength: stats.avgCycleLength,
    menstrualEnd,
    periodLoggedDays: periodDuration(latest) ?? cycleDay,
  };
  const withoutPhases = {
    cycleDay,
    cycleStart: latest.startDate,
    phase: null,
    isLateLuteal: false,
    nextPeriod,
    ovulationDay: null,
    fertileWindow: null,
    cycleLengthIsEstimate,
    ...ringFields,
    status,
  };

  // Rule 9.
  if (profile && HORMONAL_CONTRACEPTION.includes(profile.contraception)) {
    return { ...withoutPhases, mode: "hormonal", confidence };
  }

  // Rule 10.
  const recent = stats.validLengths.slice(-IRREGULAR_RECENT_COUNT);
  const isIrregular =
    validCount >= 3 &&
    (stats.sd > IRREGULAR_SD || recent.some((length) => length < REGULAR_MIN_LENGTH || length > REGULAR_MAX_LENGTH));
  if (isIrregular) {
    return { ...withoutPhases, mode: "irregular", confidence: "low" };
  }

  // Rule 12.
  const lhDay = firstPositiveLhDay(logs, latest.startDate, today);
  const bbtFirstHighDay = lhDay === null ? detectBbtShift(logs, latest.startDate, today) : null;
  const ovulationDay =
    lhDay !== null
      ? lhDay + 1
      : bbtFirstHighDay !== null
        ? bbtFirstHighDay - 1
        : predictedOvulationDay(stats.avgCycleLength, stats.avgPeriodLength);

  // Rule 13.
  const fertileWindow = {
    start: shiftDate(latest.startDate, ovulationDay - 5 - 1),
    end: shiftDate(latest.startDate, ovulationDay + 1 - 1),
  };

  // Rules 8 and 14.
  const phase = status === "late" ? "luteal" : phaseForCycleDay(cycleDay, menstrualEnd, ovulationDay);
  const daysUntilNext = daysBetween(today, nextPeriod.start);
  const isLateLuteal = phase === "luteal" && daysUntilNext >= 1 && daysUntilNext <= LATE_LUTEAL_DAYS;

  return {
    mode: "standard",
    cycleDay,
    cycleStart: latest.startDate,
    phase,
    isLateLuteal,
    nextPeriod,
    ovulationDay,
    fertileWindow,
    confidence,
    cycleLengthIsEstimate,
    ...ringFields,
    status,
  };
}

// A finished cycle: from one period start to the day before the next, with a valid length.
export interface CompletedCycle {
  startDate: string;
  endDate: string;
  length: number;
  menstrualEnd: number;
  ovulationDay: number;
}

// Phases of past cycles use the same rules, with each cycle's own length.
export function completedCycles(periods: Period[], profile: Profile | null): CompletedCycle[] {
  const sorted = sortPeriods(periods);
  const { avgPeriodLength } = computeCycleStats(sorted, profile);
  const cycles: CompletedCycle[] = [];
  sorted.slice(1).forEach((next, index) => {
    const period = sorted[index];
    const length = daysBetween(period.startDate, next.startDate);
    if (!isValidCycleLength(length)) return;
    cycles.push({
      startDate: period.startDate,
      endDate: shiftDate(next.startDate, -1),
      length,
      menstrualEnd: menstrualEndDay(period, avgPeriodLength),
      ovulationDay: predictedOvulationDay(length, avgPeriodLength),
    });
  });
  return cycles;
}

export function phaseOnDate(cycles: CompletedCycle[], date: string): { cycleIndex: number; phase: Phase } | null {
  const cycleIndex = cycles.findIndex((cycle) => date >= cycle.startDate && date <= cycle.endDate);
  if (cycleIndex === -1) return null;
  const cycle = cycles[cycleIndex];
  const cycleDay = daysBetween(cycle.startDate, date) + 1;
  return { cycleIndex, phase: phaseForCycleDay(cycleDay, cycle.menstrualEnd, cycle.ovulationDay) };
}
