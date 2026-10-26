import { differenceInCalendarDays, getISOWeek, parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { exportDataSchema } from "@/db/schema";
import { DEMO_CYCLE_LENGTHS, DEMO_PERIOD_LENGTH, generateDemoData } from "./seed";

const today = new Date(2026, 9, 25);
const data = generateDemoData(today);

describe("generateDemoData", () => {
  it("passes the export schema", () => {
    expect(exportDataSchema.safeParse(data).success).toBe(true);
  });

  it("has four past cycles of 27, 29, 28 and 30 days", () => {
    const starts = data.periods.map((period) => parseISO(period.startDate));
    const lengths = starts.slice(1).map((start, index) => differenceInCalendarDays(start, starts[index]));
    expect(lengths).toEqual([...DEMO_CYCLE_LENGTHS]);
  });

  it("has 5-day periods", () => {
    for (const period of data.periods) {
      expect(differenceInCalendarDays(parseISO(period.endDate ?? ""), parseISO(period.startDate)) + 1).toBe(
        DEMO_PERIOD_LENGTH,
      );
    }
  });

  it("logs every day from the first period until today", () => {
    const first = parseISO(data.periods[0].startDate);
    expect(data.dailyLogs).toHaveLength(differenceInCalendarDays(today, first) + 1);
  });

  it("has 3 workouts in every full week", () => {
    const perWeek = new Map<number, number>();
    for (const workout of data.workouts) {
      const week = getISOWeek(parseISO(workout.date));
      perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
    }
    const counts = [...perWeek.values()].slice(1, -1);
    expect(counts.length).toBeGreaterThan(10);
    expect(counts.every((count) => count === 3)).toBe(true);
  });

  it("is the same on every run", () => {
    expect(generateDemoData(today)).toEqual(data);
  });
});
