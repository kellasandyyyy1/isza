import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import {
  buildCalendarContext,
  markersFor,
  monthGrid,
  periodContaining,
  periodEditError,
  phaseForDate,
  sixWeekGrid,
} from "./calendar";
import { shiftDate } from "./cycle";
import { makeLog, makeProfile, periodsFromLengths } from "./testFixtures";

const TODAY = "2026-10-25";

describe("monthGrid", () => {
  it("lays out October 2026 in Sunday-first weeks", () => {
    const weeks = monthGrid(new Date(2026, 9, 1));
    expect(weeks).toHaveLength(5);
    // October 1, 2026 is a Thursday.
    expect(weeks[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(weeks[4]).toEqual(["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"]);
  });

  it("uses 6 rows when a month needs them", () => {
    // August 2026 starts on a Saturday and has 31 days.
    const weeks = monthGrid(new Date(2026, 7, 15));
    expect(weeks).toHaveLength(6);
    expect(weeks[5]).toEqual(["2026-08-30", "2026-08-31", null, null, null, null, null]);
  });
});

describe("sixWeekGrid", () => {
  it("always has 42 days and starts on the Monday on or before the 1st", () => {
    const days = sixWeekGrid(new Date(2026, 9, 15));
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-09-28");
    expect(days[3]).toBe("2026-10-01");
    expect(days[41]).toBe("2026-11-08");
  });

  it("starts on the 1st when it is a Monday", () => {
    expect(sixWeekGrid(new Date(2026, 5, 10))[0]).toBe("2026-06-01");
  });
});

describe("buildCalendarContext with the demo data", () => {
  const demo = generateDemoData(new Date(2026, 9, 25));
  const context = buildCalendarContext({
    periods: demo.periods,
    profile: demo.profile,
    logs: demo.dailyLogs,
    workouts: demo.workouts,
    today: TODAY,
  });
  const starts = demo.periods.map((period) => period.startDate);

  it("marks the 5 days of every logged period", () => {
    for (const start of starts) {
      for (let day = 0; day < 5; day++) expect(markersFor(context, shiftDate(start, day)).loggedPeriod).toBe(true);
      expect(markersFor(context, shiftDate(start, 5)).loggedPeriod).toBe(false);
    }
    expect(context.loggedPeriodDays.size).toBe(25);
  });

  it("predicts the next period: average 28.5 rounds to 29 days after the latest start, for 5 days", () => {
    const next = shiftDate(starts[4], 29);
    expect(next).toBe("2026-11-13");
    expect([...context.predictedPeriodDays]).toEqual([0, 1, 2, 3, 4].map((day) => shiftDate(next, day)));
  });

  it("marks the current and next fertile windows", () => {
    // Current cycle: ovulation predicted on day 15, so days 10 to 16.
    expect(markersFor(context, shiftDate(starts[4], 9)).fertile).toBe(true);
    expect(markersFor(context, shiftDate(starts[4], 15)).fertile).toBe(true);
    expect(markersFor(context, shiftDate(starts[4], 16)).fertile).toBe(false);
    expect(context.fertileDays.size).toBe(14);
  });

  it("marks check-ins and today", () => {
    expect(markersFor(context, TODAY)).toMatchObject({ checkIn: true, today: true });
    expect(markersFor(context, "2026-10-26")).toMatchObject({ checkIn: false, today: false });
  });

  it("gives past, current and predicted phases", () => {
    expect(phaseForDate(context, starts[0])).toEqual({ cycleDay: 1, phase: "menstrual", predicted: false });
    expect(phaseForDate(context, TODAY)).toEqual({ cycleDay: 11, phase: "follicular", predicted: false });
    expect(phaseForDate(context, "2026-11-01")).toEqual({ cycleDay: 18, phase: "luteal", predicted: true });
    expect(phaseForDate(context, "2026-11-13")).toEqual({ cycleDay: 1, phase: "menstrual", predicted: true });
  });

  it("predicts no further than the next cycle, and nothing before the first period", () => {
    expect(phaseForDate(context, shiftDate("2026-11-13", 29))).toBeNull();
    expect(phaseForDate(context, shiftDate(starts[0], -1))).toBeNull();
  });
});

describe("modes", () => {
  it("shows no fertile days or phases in hormonal mode", () => {
    const periods = periodsFromLengths("2026-07-01", [28, 28, 28]);
    const context = buildCalendarContext({
      periods,
      profile: makeProfile({ contraception: "hormonal" }),
      logs: [],
      workouts: [],
      today: TODAY,
    });
    expect(context.fertileDays.size).toBe(0);
    expect(phaseForDate(context, TODAY)).toMatchObject({ phase: null });
    expect(context.predictedPeriodDays.size).toBe(5);
  });

  it("shows nothing without periods", () => {
    const context = buildCalendarContext({ periods: [], profile: null, logs: [makeLog(TODAY)], workouts: [], today: TODAY });
    expect(context.predictedPeriodDays.size).toBe(0);
    expect(phaseForDate(context, TODAY)).toBeNull();
    expect(markersFor(context, TODAY).checkIn).toBe(true);
  });

  it("marks an open period up to today", () => {
    const periods = [{ id: 1, startDate: "2026-10-23", endDate: null }];
    const context = buildCalendarContext({ periods, profile: null, logs: [], workouts: [], today: TODAY });
    expect([...context.loggedPeriodDays]).toEqual(["2026-10-23", "2026-10-24", "2026-10-25"]);
  });
});

describe("period editing", () => {
  const periods = [
    { id: 1, startDate: "2026-09-01", endDate: "2026-09-05" },
    { id: 2, startDate: "2026-10-20", endDate: null },
  ];

  it("finds the period around a date, open periods running to today", () => {
    expect(periodContaining(periods, "2026-09-03", TODAY)?.id).toBe(1);
    expect(periodContaining(periods, "2026-10-24", TODAY)?.id).toBe(2);
    expect(periodContaining(periods, "2026-09-10", TODAY)).toBeNull();
  });

  it("accepts valid dates, including the period's own range", () => {
    expect(periodEditError(periods, 1, "2026-08-31", "2026-09-06", TODAY)).toBeNull();
    expect(periodEditError(periods, null, "2026-09-20", "2026-09-24", TODAY)).toBeNull();
  });

  it("explains invalid dates", () => {
    expect(periodEditError(periods, null, "2026-10-26", null, TODAY)).toBe("The start date can't be in the future.");
    expect(periodEditError(periods, 1, "2026-09-05", "2026-09-01", TODAY)).toBe(
      "The end date can't be before the start date.",
    );
    expect(periodEditError(periods, 1, "2026-09-01", "2026-10-30", TODAY)).toBe("The end date can't be in the future.");
    expect(periodEditError(periods, 1, "2026-09-01", "2026-10-21", TODAY)).toBe("These dates overlap another period.");
    expect(periodEditError(periods, null, "2026-09-04", "2026-09-08", TODAY)).toBe("These dates overlap another period.");
  });
});
