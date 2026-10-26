import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import {
  buildTodayView,
  cycleProgressPercent,
  formatNextPeriod,
  formatPeriodRange,
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

describe("cycleProgressPercent", () => {
  it("is the cycle day as a share of the average length, capped at 100", () => {
    expect(cycleProgressPercent(14, 28)).toBe(50);
    expect(cycleProgressPercent(40, 28)).toBe(100);
  });
});

describe("buildTodayView", () => {
  it("shows the no-data state for an empty database", () => {
    const view = buildTodayView(empty);
    expect(view).toMatchObject({
      today: "2026-10-25",
      greeting: "Good morning",
      dateLabel: "Sun, Oct 25",
      ringPercent: null,
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
    expect(view.ringPercent).toBe(Math.round((11 / 28.5) * 100));
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
    expect(view.ringPercent).toBe(32);
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

  it("lists flags that are not dismissed", () => {
    const periods = periodsFromLengths("2026-08-30", [28], 5);
    const latest = periods[1].startDate;
    const logs = [1, 2].map((day) => makeLog(dayOf(latest, day), { bleeding: "very-heavy" }));
    expect(buildTodayView({ ...empty, periods, logs }).flags.map((flag) => flag.id)).toEqual(["heavy-flow"]);
    const dismissedFlags = [{ id: "heavy-flow", until: "2026-11-24" }];
    expect(buildTodayView({ ...empty, periods, logs, dismissedFlags }).flags).toEqual([]);
  });
});
