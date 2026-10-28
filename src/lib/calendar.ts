import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { DailyLog, Period, Profile, Workout } from "@/db/schema";
import {
  completedCycles,
  computeCycleState,
  computeCycleStats,
  daysBetween,
  menstrualEndDay,
  phaseForCycleDay,
  phaseOnDate,
  predictedOvulationDay,
  shiftDate,
  sortPeriods,
  type CompletedCycle,
  type CycleState,
  type Phase,
} from "./cycle";

// One week row of a month grid. Days outside the month are null. Weeks start on Sunday.
export type CalendarWeek = (string | null)[];

export function monthGrid(month: Date): CalendarWeek[] {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const weeks: CalendarWeek[] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7).map((day) => (isSameMonth(day, month) ? format(day, "yyyy-MM-dd") : null)));
  }
  return weeks;
}

const GRID_DAYS = 42;

// Calendar screen grid: always 6 rows of 7 days, Monday first, including days of the months around it.
export function sixWeekGrid(month: Date): string[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  return Array.from({ length: GRID_DAYS }, (_, index) => format(addDays(start, index), "yyyy-MM-dd"));
}

export function isInMonth(date: string, month: Date): boolean {
  return isSameMonth(parseISO(date), month);
}

const daysFrom = (start: string, count: number) => Array.from({ length: count }, (_, index) => shiftDate(start, index));
const daysBetweenInclusive = (from: string, to: string) =>
  to < from ? [] : daysFrom(from, daysBetween(from, to) + 1);

export interface CalendarData {
  periods: Period[];
  profile: Profile | null;
  logs: DailyLog[];
  workouts: Workout[];
  // "yyyy-MM-dd"
  today: string;
}

interface NextCycle {
  start: string;
  length: number;
  menstrualEnd: number;
  ovulationDay: number;
}

export interface CalendarContext {
  today: string;
  cycle: CycleState;
  cycles: CompletedCycle[];
  latestStart: string | null;
  menstrualEnd: number;
  nextCycle: NextCycle | null;
  loggedPeriodDays: Set<string>;
  predictedPeriodDays: Set<string>;
  fertileDays: Set<string>;
  logsByDate: Map<string, DailyLog>;
  workoutsByDate: Map<string, Workout[]>;
}

// Everything the calendar needs, computed once from the cycle engine.
export function buildCalendarContext({ periods, profile, logs, workouts, today }: CalendarData): CalendarContext {
  const sorted = sortPeriods(periods);
  const cycle = computeCycleState({ periods: sorted, profile, logs, today });
  const stats = computeCycleStats(sorted, profile);
  const latest = sorted.at(-1) ?? null;
  const periodLength = Math.round(stats.avgPeriodLength);

  // Logged period days run to the end date, or to today while the period is open.
  const loggedPeriodDays = new Set(
    sorted.flatMap((period) => daysBetweenInclusive(period.startDate, period.endDate ?? today)),
  );

  const nextCycle: NextCycle | null = cycle.nextPeriod
    ? {
        start: cycle.nextPeriod.start,
        length: Math.round(stats.avgCycleLength),
        menstrualEnd: periodLength,
        ovulationDay: predictedOvulationDay(stats.avgCycleLength, stats.avgPeriodLength),
      }
    : null;

  // The next predicted period lasts the average period length.
  const predictedPeriodDays = new Set(
    nextCycle ? daysFrom(nextCycle.start, periodLength).filter((day) => !loggedPeriodDays.has(day)) : [],
  );

  // Standard mode only: the current window from the engine and the next cycle's window.
  const fertileDays = new Set<string>();
  if (cycle.mode === "standard") {
    if (cycle.fertileWindow) {
      for (const day of daysBetweenInclusive(cycle.fertileWindow.start, cycle.fertileWindow.end)) fertileDays.add(day);
    }
    if (nextCycle) {
      const start = shiftDate(nextCycle.start, nextCycle.ovulationDay - 6);
      for (const day of daysFrom(start, 7)) fertileDays.add(day);
    }
  }

  const workoutsByDate = new Map<string, Workout[]>();
  for (const workout of workouts) workoutsByDate.set(workout.date, [...(workoutsByDate.get(workout.date) ?? []), workout]);

  return {
    today,
    cycle,
    cycles: completedCycles(sorted, profile),
    latestStart: latest?.startDate ?? null,
    menstrualEnd: latest ? menstrualEndDay(latest, stats.avgPeriodLength) : periodLength,
    nextCycle,
    loggedPeriodDays,
    predictedPeriodDays,
    fertileDays,
    logsByDate: new Map(logs.map((log) => [log.date, log])),
    workoutsByDate,
  };
}

export interface DayPhase {
  cycleDay: number;
  // Null in hormonal and irregular modes.
  phase: Phase | null;
  // True for days after today.
  predicted: boolean;
}

// Past cycles use their own length. The current cycle uses the engine's ovulation day.
// The next predicted cycle is the furthest the calendar predicts.
export function phaseForDate(context: CalendarContext, date: string): DayPhase | null {
  const { cycle, cycles, latestStart, nextCycle, today } = context;
  if (latestStart === null || date < (cycles[0]?.startDate ?? latestStart)) return null;
  const standard = cycle.mode === "standard";

  const past = phaseOnDate(cycles, date);
  if (past) {
    const cycleDay = daysBetween(cycles[past.cycleIndex].startDate, date) + 1;
    return { cycleDay, phase: standard ? past.phase : null, predicted: false };
  }

  const inNextCycle = nextCycle !== null && date > today && date >= nextCycle.start;
  if (date >= latestStart && !inNextCycle) {
    const cycleDay = daysBetween(latestStart, date) + 1;
    const phase =
      standard && cycle.ovulationDay !== null
        ? cycle.status === "late" && date <= today
          ? "luteal"
          : phaseForCycleDay(cycleDay, context.menstrualEnd, cycle.ovulationDay)
        : null;
    return { cycleDay, phase, predicted: date > today };
  }

  if (nextCycle && inNextCycle && date < shiftDate(nextCycle.start, nextCycle.length)) {
    const cycleDay = daysBetween(nextCycle.start, date) + 1;
    const phase = standard ? phaseForCycleDay(cycleDay, nextCycle.menstrualEnd, nextCycle.ovulationDay) : null;
    return { cycleDay, phase, predicted: true };
  }
  return null;
}

export interface DayMarkers {
  loggedPeriod: boolean;
  predictedPeriod: boolean;
  fertile: boolean;
  // The first and last day of a fertile window, where the band is rounded.
  fertileStart: boolean;
  fertileEnd: boolean;
  checkIn: boolean;
  today: boolean;
}

export function markersFor(context: CalendarContext, date: string): DayMarkers {
  const fertile = context.fertileDays.has(date);
  return {
    loggedPeriod: context.loggedPeriodDays.has(date),
    predictedPeriod: context.predictedPeriodDays.has(date),
    fertile,
    fertileStart: fertile && !context.fertileDays.has(shiftDate(date, -1)),
    fertileEnd: fertile && !context.fertileDays.has(shiftDate(date, 1)),
    checkIn: context.logsByDate.has(date),
    today: date === context.today,
  };
}

export type LegendMarker = "logged" | "predicted" | "fertile" | "check-in";
const LEGEND_ORDER: LegendMarker[] = ["logged", "predicted", "fertile", "check-in"];

// The legend items for the days on screen: only markers that at least one of them carries, in legend order.
export function legendMarkers(context: CalendarContext, dates: string[]): LegendMarker[] {
  const shown = new Set<LegendMarker>();
  for (const date of dates) {
    const markers = markersFor(context, date);
    if (markers.loggedPeriod) shown.add("logged");
    if (markers.predictedPeriod) shown.add("predicted");
    if (markers.fertile) shown.add("fertile");
    if (markers.checkIn) shown.add("check-in");
  }
  return LEGEND_ORDER.filter((marker) => shown.has(marker));
}

// Period editing

const periodEnd = (period: Pick<Period, "endDate">, today: string) => period.endDate ?? today;

export function periodContaining(periods: Period[], date: string, today: string): Period | null {
  return periods.find((period) => period.startDate <= date && date <= periodEnd(period, today)) ?? null;
}

// Null when the dates can be saved, else a short reason.
export function periodEditError(
  periods: Period[],
  editingId: number | null,
  startDate: string,
  endDate: string | null,
  today: string,
): string | null {
  if (startDate > today) return "The start date can't be in the future.";
  if (endDate !== null && endDate < startDate) return "The end date can't be before the start date.";
  if (endDate !== null && endDate > today) return "The end date can't be in the future.";
  const end = endDate ?? today;
  const overlaps = periods.some(
    (period) => period.id !== editingId && period.startDate <= end && startDate <= periodEnd(period, today),
  );
  return overlaps ? "These dates overlap another period." : null;
}
