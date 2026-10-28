import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import { cycleSummary, recentCycles } from "./cycleHistory";
import { REPORT_FOOTER, buildReport, reportFileName } from "./report";
import { dayOf, makeLog, makeProfile, periodsFromLengths } from "./testFixtures";

const TODAY = "2026-10-25";
const demo = generateDemoData(new Date(2026, 9, 25));
const demoInput = { periods: demo.periods, profile: demo.profile, logs: demo.dailyLogs, today: TODAY };

describe("cycleSummary", () => {
  it("summarises the demo cycles", () => {
    expect(cycleSummary(demo.periods, demo.profile, TODAY)).toEqual({
      avgCycleLength: 28.5,
      avgPeriodLength: 5,
      usualRange: { min: 27, max: 30 },
      confidence: "high",
    });
  });

  it("has no range with fewer than 2 cycles", () => {
    const periods = [{ id: 1, startDate: "2026-10-01", endDate: null }];
    expect(cycleSummary(periods, makeProfile({ typicalCycleLength: 30 }), TODAY)).toMatchObject({
      avgCycleLength: 30,
      usualRange: null,
      confidence: "medium",
    });
  });
});

describe("recentCycles", () => {
  it("lists completed cycles oldest first with their period length", () => {
    expect(recentCycles(demo.periods, demo.profile).map((cycle) => [cycle.length, cycle.periodLength])).toEqual([
      [27, 5],
      [29, 5],
      [28, 5],
      [30, 5],
    ]);
  });

  it("keeps only the last ones", () => {
    const periods = periodsFromLengths("2026-01-01", [28, 29, 30, 31, 27, 26, 28]);
    expect(recentCycles(periods, null).map((cycle) => cycle.length)).toEqual([29, 30, 31, 27, 26, 28]);
    expect(recentCycles(periods, null, 3).map((cycle) => cycle.length)).toEqual([27, 26, 28]);
  });
});

describe("buildReport", () => {
  it("is null without a completed cycle", () => {
    const periods = [{ id: 1, startDate: "2026-10-01", endDate: null }];
    expect(buildReport({ periods, profile: null, logs: [], today: TODAY, cycleCount: 3, includeNotes: false })).toBeNull();
  });

  it("reports the last 3 demo cycles", () => {
    const report = buildReport({ ...demoInput, cycleCount: 3, includeNotes: false });
    expect(report).toMatchObject({
      createdOn: TODAY,
      range: { from: demo.periods[1].startDate, to: TODAY },
      contraception: "None",
      cycleLength: { average: 29, min: 28, max: 30 },
      periodLength: { average: 5, min: 5, max: 5 },
      showPhases: true,
      flags: [],
      notes: null,
    });
    expect(report?.cycles.map((cycle) => cycle.length)).toEqual([29, 28, 30]);
  });

  it("reports all 4 demo cycles when 6 are asked for", () => {
    const report = buildReport({ ...demoInput, cycleCount: 6, includeNotes: false });
    expect(report?.cycles).toHaveLength(4);
    expect(report?.cycleLength).toEqual({ average: 28.5, min: 27, max: 30 });
  });

  it("counts symptom days by phase across the included cycles", () => {
    const report = buildReport({ ...demoInput, cycleCount: 6, includeNotes: false });
    const cramps = report?.symptoms.find((row) => row.symptom === "Cramps");
    // The demo logs cramps on days 1 to 3 of every period: 4 cycles x 3 days, all menstrual.
    expect(cramps).toEqual({
      symptom: "Cramps",
      byPhase: { menstrual: 12, follicular: 0, ovulatory: 0, luteal: 0 },
      all: 12,
    });
    const bloating = report?.symptoms.find((row) => row.symptom === "Bloating");
    expect(bloating?.byPhase.luteal).toBeGreaterThan(0);
    expect(bloating?.byPhase.menstrual).toBe(0);
  });

  it("leaves phases out in hormonal mode", () => {
    const profile = makeProfile({ contraception: "iud-hormonal" });
    const periods = periodsFromLengths("2026-08-01", [28, 28]);
    const logs = [makeLog(dayOf(periods[0].startDate, 2), { symptoms: [{ key: "acne", severity: 1 }] })];
    const report = buildReport({ periods, profile, logs, today: TODAY, cycleCount: 3, includeNotes: false });
    expect(report).toMatchObject({ showPhases: false, contraception: "Hormonal IUD" });
    expect(report?.symptoms[0]).toEqual({
      symptom: "Acne",
      byPhase: { menstrual: 0, follicular: 0, ovulatory: 0, luteal: 0 },
      all: 1,
    });
  });

  it("includes notes in the date range only when asked", () => {
    const periods = periodsFromLengths("2026-09-01", [28]);
    const logs = [
      makeLog("2026-08-20", { note: "Before the report" }),
      makeLog("2026-09-03", { note: "Tired today" }),
      makeLog("2026-09-04", { note: null }),
    ];
    const base = { periods, profile: null, logs, today: TODAY, cycleCount: 3 } as const;
    expect(buildReport({ ...base, includeNotes: false })?.notes).toBeNull();
    expect(buildReport({ ...base, includeNotes: true })?.notes).toEqual([{ date: "2026-09-03", text: "Tired today" }]);
  });

  it("includes raised flags even if they were dismissed in the app", () => {
    const periods = periodsFromLengths("2026-08-01", [28], 9);
    const report = buildReport({ periods, profile: null, logs: [], today: TODAY, cycleCount: 3, includeNotes: false });
    expect(report?.flags.map((flag) => flag.title)).toContain("Your last period was long");
  });
});

describe("report text", () => {
  it("names the file by date and keeps the required footer", () => {
    expect(reportFileName(TODAY)).toBe("iszacycle-report-2026-10-25.pdf");
    expect(REPORT_FOOTER).toContain("Iszacycle is not a medical device or a contraceptive.");
    expect(REPORT_FOOTER).toContain("This summary is based on self-reported data.");
  });
});
