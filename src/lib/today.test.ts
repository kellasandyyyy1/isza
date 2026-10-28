import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import {
  buildTodayView,
  formatLatePeriod,
  formatNextPeriod,
  formatPeriodBasis,
  formatPeriodRange,
  LATE_DOCTOR_NOTE,
  LATE_NOTE,
  latePeriodNotes,
  greetingFor,
  periodQuickAction,
} from "./today";
import type { CycleState } from "./cycle";
import { dayOf, makeLog, makeProfile, periodsFromLengths } from "./testFixtures";

// October 25, 2026 at 9:00 local time.
const NOW = new Date(2026, 9, 25, 9, 0);
const empty = { profile: null, periods: [], logs: [], dismissedFlags: [], now: NOW };

describe("greetingFor", () => {
  it("picks the part of the day and adds the name when set", () => {
    expect(greetingFor(8, null)).toBe("Good morning");
    expect(greetingFor(12, "Mia")).toBe("Good afternoon, Mia");
    expect(greetingFor(18, null)).toBe("Good evening");
  });
});

describe("formatNextPeriod", () => {
  const TODAY = "2026-10-25";
  const next = (start: string) => ({ start, earliest: start, latest: start });

  it("says the period may be late", () => {
    expect(formatNextPeriod(next("2026-10-20"), TODAY, "late")).toBe("Period may be late");
  });

  it("is null without a prediction", () => {
    expect(formatNextPeriod(null, TODAY, "ok")).toBeNull();
  });

  it("says today for 0 days, and for a start that has just passed", () => {
    expect(formatNextPeriod(next("2026-10-25"), TODAY, "ok")).toBe("Period expected today");
    expect(formatNextPeriod(next("2026-10-24"), TODAY, "ok")).toBe("Period expected today");
  });

  it("says tomorrow for 1 day", () => {
    expect(formatNextPeriod(next("2026-10-26"), TODAY, "ok")).toBe("Period expected tomorrow");
  });

  it("counts days from 2 to 13", () => {
    expect(formatNextPeriod(next("2026-10-27"), TODAY, "ok")).toBe("Period in about 2 days");
    expect(formatNextPeriod(next("2026-11-07"), TODAY, "ok")).toBe("Period in about 13 days");
  });

  it("rounds to weeks from 14 to 90 days", () => {
    expect(formatNextPeriod(next("2026-11-08"), TODAY, "ok")).toBe("Period in about 2 weeks");
    // 24 days is 3.4 weeks.
    expect(formatNextPeriod(next("2026-11-18"), TODAY, "ok")).toBe("Period in about 3 weeks");
    // 25 days is 3.6 weeks.
    expect(formatNextPeriod(next("2026-11-19"), TODAY, "ok")).toBe("Period in about 4 weeks");
    expect(formatNextPeriod(next("2027-01-23"), TODAY, "ok")).toBe("Period in about 13 weeks");
  });

  it("is null more than 90 days away", () => {
    expect(formatNextPeriod(next("2027-01-24"), TODAY, "ok")).toBeNull();
  });
});

describe("formatPeriodRange", () => {
  it("shortens a range inside one month", () => {
    expect(formatPeriodRange({ start: "2026-11-04", earliest: "2026-11-03", latest: "2026-11-06" })).toBe("Nov 3 to 6");
  });

  it("names both months across a month change", () => {
    expect(formatPeriodRange({ start: "2026-10-31", earliest: "2026-10-30", latest: "2026-11-02" })).toBe("Oct 30 to Nov 2");
  });

  it("is null without a prediction", () => {
    expect(formatPeriodRange(null)).toBeNull();
  });
});

describe("periodQuickAction", () => {
  const TODAY = "2026-10-25";
  const cycle = (overrides: Partial<CycleState> = {}) =>
    ({
      mode: "standard",
      status: "ok",
      nextPeriod: { start: "2026-10-28", earliest: "2026-10-26", latest: "2026-10-30" },
      ...overrides,
    }) as CycleState;
  const closed = [{ id: 1, startDate: "2026-09-28", endDate: "2026-10-02" }];

  it("offers start from 1 day before the earliest predicted start", () => {
    expect(periodQuickAction(closed, cycle(), TODAY)).toEqual({ kind: "start" });
  });

  it("does not offer start earlier than that", () => {
    const later = cycle({ nextPeriod: { start: "2026-10-30", earliest: "2026-10-27", latest: "2026-11-01" } });
    expect(periodQuickAction(closed, later, TODAY)).toBeNull();
  });

  it("offers start when the period is late", () => {
    expect(periodQuickAction(closed, cycle({ status: "late", nextPeriod: null }), TODAY)).toEqual({ kind: "start" });
  });

  it("offers end when the open period started 3 or more days ago", () => {
    const open = [...closed, { id: 2, startDate: "2026-10-22", endDate: null }];
    expect(periodQuickAction(open, cycle(), TODAY)).toEqual({ kind: "end", periodId: 2 });
  });

  it("offers nothing while the open period is under 3 days old", () => {
    const open = [...closed, { id: 2, startDate: "2026-10-23", endDate: null }];
    expect(periodQuickAction(open, cycle({ status: "late" }), TODAY)).toBeNull();
  });

  it("offers nothing in no-data mode", () => {
    expect(periodQuickAction([], cycle({ mode: "no-data", status: "late" }), TODAY)).toBeNull();
  });
});

describe("late period copy", () => {
  it("counts days late in words, with the singular for 1", () => {
    expect(formatLatePeriod(1)).toBe("Period is 1 day late");
    expect(formatLatePeriod(10)).toBe("Period is 10 days late");
  });

  it("adds the doctor line from 45 days late", () => {
    expect(latePeriodNotes(44)).toEqual([LATE_NOTE]);
    expect(latePeriodNotes(45)).toEqual([LATE_NOTE, LATE_DOCTOR_NOTE]);
    expect(LATE_DOCTOR_NOTE).toBe("If your period has not come and you are not sure why, consider talking to a doctor.");
  });
});

describe("formatPeriodBasis", () => {
  it("names the cycles behind the average, or says it is an estimate", () => {
    expect(formatPeriodBasis(0)).toBe("estimate, keep logging");
    expect(formatPeriodBasis(1)).toBe("estimate, keep logging");
    expect(formatPeriodBasis(2)).toBe("based on 2 cycles");
    // The average uses the last 6 cycles at most.
    expect(formatPeriodBasis(9)).toBe("based on 6 cycles");
  });
});

describe("buildTodayView", () => {
  it("shows the no-data state for an empty database", () => {
    const view = buildTodayView(empty);
    expect(view).toMatchObject({
      today: "2026-10-25",
      greeting: "Good morning",
      dateLabel: "Sun, Oct 25",
      nextPeriodBasis: null,
      lateDays: null,
      lateNotes: [],
      nextPeriodText: null,
      nextPeriodRange: null,
      periodAction: null,
      guidanceKey: "neutral",
      flags: [],
      todayLog: null,
    });
    expect(view.cycle.mode).toBe("no-data");
  });

  it("shows a standard cycle for the demo data", () => {
    const demo = generateDemoData(NOW);
    const view = buildTodayView({ ...empty, profile: demo.profile, periods: demo.periods, logs: demo.dailyLogs });
    expect(view.cycle).toMatchObject({ mode: "standard", cycleDay: 11, phase: "follicular" });
    expect(view.guidanceKey).toBe("follicular");
    // Several logged cycles: "of 29" shows on the ring, and the range names how many cycles it is based on.
    expect(view.cycle).toMatchObject({ cycleLengthIsEstimate: false, avgCycleLength: 28.5, periodLoggedDays: 5 });
    expect(view.nextPeriodBasis).toMatch(/^based on \d cycles$/);
    // Day 11 of a 28.5-day average: the next period starts in about 18 days.
    expect(view.nextPeriodText).toBe("Period in about 3 weeks");
    expect(view.nextPeriodRange).toMatch(/^Nov \d+ to \d+$/);
    expect(view.periodAction).toBeNull();
    expect(view.todayLog?.date).toBe("2026-10-25");
    expect(view.mood).toBe({ Go: "cheer", Steady: "calm", Rest: "tired" }[view.readiness.band]);
  });

  it("hides phases for hormonal contraception", () => {
    const periods = [{ id: 1, startDate: "2026-10-17", endDate: "2026-10-21" }];
    const view = buildTodayView({ ...empty, periods, profile: makeProfile({ contraception: "hormonal" }) });
    expect(view.cycle).toMatchObject({ mode: "hormonal", cycleDay: 9, phase: null });
    expect(view.guidanceKey).toBe("neutral");
    // One period: 28 is a default, so "of 28" stays hidden on the ring.
    expect(view.cycle).toMatchObject({ cycleLengthIsEstimate: true, avgCycleLength: 28, ovulationDay: null });
    expect(view.nextPeriodBasis).toBe("estimate, keep logging");
  });

  it("hides phases for irregular cycles", () => {
    const periods = periodsFromLengths("2026-07-01", [22, 40, 26]);
    const view = buildTodayView({ ...empty, periods });
    expect(view.cycle).toMatchObject({ mode: "irregular", phase: null });
    expect(view.guidanceKey).toBe("neutral");
  });

  it("shows the period-prep card only 2 days before the predicted period", () => {
    // A 28-day cycle that started on Sep 30 predicts the next period on Oct 28: 3 days after Oct 25.
    const periods = [{ id: 1, startDate: "2026-09-30", endDate: "2026-10-04" }];
    const profile = makeProfile({ typicalCycleLength: 28 });
    expect(buildTodayView({ ...empty, periods, profile }).periodPrep).toBeNull();
    const twoDaysOut = buildTodayView({ ...empty, periods, profile, now: new Date(2026, 9, 26, 9) });
    expect(twoDaysOut.periodPrep).toBe("Period likely in 2 days. Pack your supplies.");
    const discreet = buildTodayView({
      ...empty,
      periods,
      profile: makeProfile({ typicalCycleLength: 28, discreetMode: true }),
      now: new Date(2026, 9, 26, 9),
    });
    expect(discreet.periodPrep).toBe("Plan ahead: check your supplies.");
    expect(buildTodayView({ ...empty, periods, profile, now: new Date(2026, 9, 27, 9) }).periodPrep).toBeNull();
  });

  it("shows the late state at 1, 10 and 50 days late, counted from the latest predicted day", () => {
    // Started Aug 1 with a 28-day default: predicted Aug 29, range Aug 26 to Sep 1.
    const periods = [{ id: 1, startDate: "2026-08-01", endDate: "2026-08-05" }];
    const on = (date: Date) => buildTodayView({ ...empty, periods, now: date });

    const oneDay = on(new Date(2026, 8, 2, 9));
    expect(oneDay).toMatchObject({ lateDays: 1, nextPeriodText: "Period is 1 day late", nextPeriodRange: null });
    expect(oneDay.lateNotes).toEqual([LATE_NOTE]);
    expect(oneDay.periodAction).toEqual({ kind: "start" });

    expect(on(new Date(2026, 8, 11, 9))).toMatchObject({ lateDays: 10, nextPeriodText: "Period is 10 days late" });

    const fifty = on(new Date(2026, 9, 21, 9));
    expect(fifty).toMatchObject({ lateDays: 50, nextPeriodText: "Period is 50 days late", nextPeriodBasis: null });
    expect(fifty.lateNotes).toEqual([LATE_NOTE, LATE_DOCTOR_NOTE]);
    expect(fifty.periodAction).toEqual({ kind: "start" });
  });

  it("is not late on the latest predicted day", () => {
    const periods = [{ id: 1, startDate: "2026-08-01", endDate: "2026-08-05" }];
    const view = buildTodayView({ ...empty, periods, now: new Date(2026, 8, 1, 9) });
    expect(view).toMatchObject({ lateDays: null, lateNotes: [] });
  });

  it("lists flags that are not dismissed", () => {
    const periods = periodsFromLengths("2026-08-30", [28], 5);
    const latest = periods[1].startDate;
    const logs = [1, 2].map((day) => makeLog(dayOf(latest, day), { bleeding: "very-heavy" }));
    expect(buildTodayView({ ...empty, periods, logs }).flags.map((flag) => flag.id)).toEqual(["heavy-flow"]);
    const dismissedFlags = [{ id: "heavy-flow", until: "2026-11-24" }];
    expect(buildTodayView({ ...empty, periods, logs, dismissedFlags }).flags).toEqual([]);
  });
});
