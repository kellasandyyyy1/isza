import { describe, expect, it } from "vitest";
import type { DailyLog, SymptomEntry } from "@/db/schema";
import type { CycleState, Phase } from "./cycle";
import { bandFor, computeReadiness, type ReadinessInput } from "./readiness";
import { dayOf, makeLog, periodsFromLengths } from "./testFixtures";

const TODAY = "2026-10-25";

function cycleWith(phase: Phase | null, isLateLuteal = false): CycleState {
  return {
    mode: phase === null ? "hormonal" : "standard",
    cycleDay: 10,
    phase,
    isLateLuteal,
    nextPeriod: null,
    ovulationDay: null,
    fertileWindow: null,
    confidence: "high",
    status: "ok",
  };
}

const noHistory: ReadinessInput["history"] = { periods: [], logs: [], profile: null };

function readiness(
  phase: Phase | null,
  today: Partial<Omit<DailyLog, "date">> | null,
  options: { yesterday?: Partial<Omit<DailyLog, "date">>; late?: boolean; history?: ReadinessInput["history"] } = {},
) {
  return computeReadiness({
    cycle: cycleWith(phase, options.late),
    todayLog: today ? makeLog(TODAY, today) : null,
    yesterdayLog: options.yesterday ? makeLog("2026-10-24", options.yesterday) : null,
    history: options.history ?? noHistory,
  });
}

describe("computeReadiness", () => {
  it("follicular, energy 5, sleep 8 gives 80 + 10 + 4 = 94", () => {
    const result = readiness("follicular", { energy: 5, sleepHours: 8 });
    expect(result.score).toBe(94);
    expect(result.band).toBe("Go");
    expect(result.breakdown).toEqual([
      { label: "Cycle phase", points: 80 },
      { label: "Energy", points: 10 },
      { label: "Sleep", points: 4 },
    ]);
  });

  it("uses the base for each phase", () => {
    expect(readiness("menstrual", null).score).toBe(55);
    expect(readiness("follicular", null).score).toBe(80);
    expect(readiness("ovulatory", null).score).toBe(85);
    expect(readiness("luteal", null).score).toBe(70);
    expect(readiness("luteal", null, { late: true }).score).toBe(58);
    expect(readiness(null, null).score).toBe(70);
  });

  it("is an estimate without any energy logged today or yesterday", () => {
    expect(readiness("follicular", null).isEstimate).toBe(true);
    expect(readiness("follicular", { sleepHours: 8 }).isEstimate).toBe(true);
  });

  it("is not an estimate once energy is logged today or yesterday", () => {
    expect(readiness("follicular", { energy: 4 }).isEstimate).toBe(false);
    expect(readiness("follicular", null, { yesterday: { energy: 2 } }).isEstimate).toBe(false);
  });

  it("falls back to yesterday's energy", () => {
    expect(readiness("luteal", {}, { yesterday: { energy: 1 } }).score).toBe(60);
    expect(readiness("luteal", { energy: 4 }, { yesterday: { energy: 1 } }).score).toBe(75);
  });

  it("limits sleep points to minus 12 and plus 8", () => {
    expect(readiness("luteal", { sleepHours: 2 }).score).toBe(58);
    expect(readiness("luteal", { sleepHours: 12 }).score).toBe(78);
  });

  it("subtracts 8 per severity 3 and 4 per severity 2, capped at 20", () => {
    const symptoms: SymptomEntry[] = [
      { key: "cramps", severity: 2 },
      { key: "headache", severity: 1 },
    ];
    expect(readiness("luteal", { symptoms }).score).toBe(66);
    const severe: SymptomEntry[] = [
      { key: "cramps", severity: 3 },
      { key: "headache", severity: 3 },
      { key: "bloating", severity: 3 },
    ];
    expect(readiness("luteal", { symptoms: severe }).breakdown.at(-1)).toEqual({ label: "Symptoms", points: -20 });
  });

  it("subtracts 5 for heavy or very heavy flow", () => {
    expect(readiness("menstrual", { bleeding: "heavy" }).score).toBe(50);
    expect(readiness("menstrual", { bleeding: "very-heavy" }).score).toBe(50);
    expect(readiness("menstrual", { bleeding: "medium" }).score).toBe(55);
  });

  it("never goes above 100", () => {
    expect(readiness("ovulatory", { energy: 5, sleepHours: 10 }).score).toBe(100);
  });

  // Four starts, 28 days apart: three completed cycles with menstrual days 1 to 5.
  const periods = periodsFromLengths("2026-06-01", [28, 28, 28]);
  const menstrualLogs = (energy: 1 | 2 | 3 | 4 | 5, cycles: number) =>
    periods.slice(0, cycles).flatMap((period) => [1, 2].map((day) => makeLog(dayOf(period.startDate, day), { energy })));

  it("never goes below 0", () => {
    const history = { periods, logs: menstrualLogs(1, 3), profile: null };
    const symptoms: SymptomEntry[] = [
      { key: "cramps", severity: 3 },
      { key: "headache", severity: 3 },
      { key: "bloating", severity: 3 },
    ];
    const result = readiness("menstrual", { energy: 1, sleepHours: 0, symptoms, bleeding: "very-heavy" }, { history });
    expect(result.score).toBe(0);
    expect(result.band).toBe("Rest");
  });

  it("blends in personal energy after 3 completed cycles and 5 values", () => {
    const history = { periods, logs: menstrualLogs(5, 3), profile: null };
    const result = readiness("menstrual", null, { history });
    expect(result.breakdown[0]).toEqual({ label: "Cycle phase and your history", points: 78 });
  });

  it("skips the blend with fewer than 5 energy values", () => {
    const history = { periods, logs: menstrualLogs(5, 2), profile: null };
    expect(readiness("menstrual", null, { history }).score).toBe(55);
  });

  it("skips the blend with fewer than 3 completed cycles", () => {
    const history = { periods: periods.slice(0, 3), logs: menstrualLogs(5, 3), profile: null };
    expect(readiness("menstrual", null, { history }).score).toBe(55);
  });
});

describe("bandFor", () => {
  it("maps scores to bands", () => {
    expect(bandFor(0)).toBe("Rest");
    expect(bandFor(44)).toBe("Rest");
    expect(bandFor(45)).toBe("Steady");
    expect(bandFor(69)).toBe("Steady");
    expect(bandFor(70)).toBe("Go");
    expect(bandFor(100)).toBe("Go");
  });
});
