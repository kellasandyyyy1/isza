import { describe, expect, it } from "vitest";
import type { DailyLog, Period, Workout } from "@/db/schema";
import { computeCycleState, computeCycleStats } from "./cycle";
import {
  computeInsights,
  getCurrentCycleSummary,
  getInsightProgress,
  moodSummaryText,
  symptomChipLabels,
} from "./insights";
import { dayOf, makeLog, makeProfile, makeWorkout, periodsFromLengths } from "./testFixtures";

// Five starts, 28 days apart: four completed cycles.
// Phases: menstrual 1 to 5, follicular 6 to 12, ovulatory 13 to 15, luteal 16 to 28.
const periods = periodsFromLengths("2026-05-01", [28, 28, 28, 28]);
const starts = periods.map((period) => period.startDate);

function insightsFor(logs: DailyLog[] = [], workouts: Workout[] = []) {
  return computeInsights({ periods, logs, workouts, profile: null });
}

describe("computeInsights", () => {
  it("needs 2 or more completed cycles", () => {
    const logs = [makeLog(dayOf(starts[0], 8), { energy: 4 })];
    expect(computeInsights({ periods: periods.slice(0, 2), logs, workouts: [], profile: null })).toEqual([]);
    expect(computeInsights({ periods: periods.slice(0, 3), logs, workouts: [], profile: null })).not.toEqual([]);
  });

  it("finds a symptom in the same phase in 3 of the last cycles", () => {
    const logs = [0, 1, 2].map((cycle) => makeLog(dayOf(starts[cycle], 1), { symptoms: [{ key: "cramps", severity: 2 }] }));
    expect(insightsFor(logs)).toContainEqual({
      kind: "symptom-pattern",
      phase: "menstrual",
      text: "Cramps often shows up in your menstrual phase (3 of your last 4 cycles).",
      pattern: { symptom: "cramps", count: 3, of: 4 },
    });
  });

  it("ignores a symptom in only 2 cycles or spread across phases", () => {
    const logs = [
      makeLog(dayOf(starts[0], 1), { symptoms: [{ key: "bloating", severity: 1 }] }),
      makeLog(dayOf(starts[1], 1), { symptoms: [{ key: "bloating", severity: 1 }] }),
      makeLog(dayOf(starts[2], 20), { symptoms: [{ key: "bloating", severity: 1 }] }),
    ];
    expect(insightsFor(logs).filter((insight) => insight.kind === "symptom-pattern")).toEqual([]);
  });

  it("counts a symptom once per cycle", () => {
    const logs = [1, 2, 3].map((day) => makeLog(dayOf(starts[0], day), { symptoms: [{ key: "cramps", severity: 2 }] }));
    expect(insightsFor(logs).filter((insight) => insight.kind === "symptom-pattern")).toEqual([]);
  });

  it("averages energy per phase to one decimal", () => {
    const logs = [
      makeLog(dayOf(starts[0], 8), { energy: 3 }),
      makeLog(dayOf(starts[1], 8), { energy: 4 }),
      makeLog(dayOf(starts[2], 8), { energy: 4 }),
      makeLog(dayOf(starts[0], 2), { energy: 2 }),
    ];
    const energy = insightsFor(logs).filter((insight) => insight.kind === "energy-by-phase");
    expect(energy).toEqual([
      { kind: "energy-by-phase", phase: "menstrual", text: "Your energy averages 2.0 of 5 in your menstrual phase." },
      { kind: "energy-by-phase", phase: "follicular", text: "Your energy averages 3.7 of 5 in your follicular phase." },
    ]);
  });

  it("picks the phase with the highest share of strong workouts", () => {
    const workouts = [
      ...[6, 7, 8, 9].map((day, index) => makeWorkout(dayOf(starts[0], day), index < 3 ? "strong" : "normal")),
      ...[0, 1, 2, 3].map((cycle) => makeWorkout(dayOf(starts[cycle], 14), "strong")),
      ...[0, 1, 2].map((cycle) => makeWorkout(dayOf(starts[cycle], 2), "strong")),
    ];
    expect(insightsFor([], workouts)).toContainEqual({
      kind: "best-training-window",
      phase: "ovulatory",
      text: "You often feel strongest training in your ovulatory phase (100% of workouts felt strong).",
    });
  });

  it("needs at least 4 workouts in a phase", () => {
    const workouts = [0, 1, 2].map((cycle) => makeWorkout(dayOf(starts[cycle], 14), "strong"));
    expect(insightsFor([], workouts).filter((insight) => insight.kind === "best-training-window")).toEqual([]);
  });
});

describe("getInsightProgress", () => {
  const TODAY = "2026-10-25";

  // The same inputs the Insights screen uses, so the date follows the engine's prediction.
  function progressFor(list: Period[], typicalCycleLength: number | null = null) {
    const profile = makeProfile({ typicalCycleLength });
    const cycle = computeCycleState({ periods: list, profile, logs: [], today: TODAY });
    const { validLengths, avgCycleLength } = computeCycleStats(list, profile);
    return { cycle, progress: getInsightProgress(cycle, validLengths, avgCycleLength) };
  }

  it("with no completed cycle: one average cycle after the next predicted period", () => {
    // One period on Oct 10 and a typical length of 30: next period Nov 9, first patterns Dec 9.
    const { cycle, progress } = progressFor(periodsFromLengths("2026-10-10", []), 30);
    expect(cycle.nextPeriod?.start).toBe("2026-11-09");
    expect(progress).toEqual({ completedCycles: 0, needed: 2, unlockDate: "2026-12-09" });
  });

  it("with one completed cycle: the next predicted period", () => {
    const { cycle, progress } = progressFor(periodsFromLengths("2026-09-12", [29]));
    expect(progress).toEqual({ completedCycles: 1, needed: 2, unlockDate: cycle.nextPeriod?.start });
    expect(progress.unlockDate).toBe("2026-11-09");
  });

  it("with 2 or more completed cycles: no date", () => {
    expect(progressFor(periodsFromLengths("2026-08-15", [28, 28])).progress).toEqual({
      completedCycles: 2,
      needed: 2,
      unlockDate: null,
    });
    expect(progressFor(periods).progress.unlockDate).toBeNull();
  });

  it("without any period: no date", () => {
    expect(progressFor([]).progress).toEqual({ completedCycles: 0, needed: 2, unlockDate: null });
  });

  it("counts only valid cycle lengths", () => {
    // 10 days is too short to count as a cycle.
    const { progress } = progressFor(periodsFromLengths("2026-09-05", [10, 28]));
    expect(progress.completedCycles).toBe(1);
  });
});

describe("getCurrentCycleSummary", () => {
  // The current cycle started Oct 15. Logs before it belong to the last cycle.
  const state = computeCycleState({
    periods: [{ id: 1, startDate: "2026-10-15", endDate: "2026-10-19" }],
    profile: null,
    logs: [],
    today: "2026-10-25",
  });
  const summary = (logs: DailyLog[], workouts: Workout[] = []) => getCurrentCycleSummary(logs, workouts, state);
  const noMoods = { great: 0, good: 0, okay: 0, low: 0, bad: 0 };

  it("is all zeros with no check-ins, and avgEnergy is null", () => {
    expect(summary([])).toEqual({
      checkInCount: 0,
      avgEnergy: null,
      moodCounts: noMoods,
      topSymptoms: [],
      moreSymptoms: 0,
      bleedingDays: 0,
      workoutCount: 0,
    });
  });

  it("counts a single check-in", () => {
    const result = summary([makeLog("2026-10-16", { energy: 4, mood: "good", bleeding: "light" })]);
    expect(result).toMatchObject({ checkInCount: 1, avgEnergy: 4, bleedingDays: 1, topSymptoms: [] });
    expect(result.moodCounts).toEqual({ ...noMoods, good: 1 });
  });

  it("counts 4 check-ins in this cycle and leaves out the last cycle's", () => {
    const logs = [
      makeLog("2026-10-14", { energy: 1, mood: "bad", bleeding: "light", symptoms: [{ key: "acne", severity: 1 }] }),
      makeLog("2026-10-15", { energy: 2, mood: "low", bleeding: "heavy", symptoms: [{ key: "cramps", severity: 3 }] }),
      makeLog("2026-10-16", { energy: 3, mood: "okay", bleeding: "spotting", symptoms: [{ key: "cramps", severity: 1 }] }),
      makeLog("2026-10-20", { energy: null, mood: "okay", symptoms: [{ key: "headache", severity: 1 }] }),
      makeLog("2026-10-25", { energy: 4 }),
    ];
    const workouts = [makeWorkout("2026-10-14", "strong"), makeWorkout("2026-10-17", "normal"), makeWorkout("2026-10-24", "weak")];
    expect(summary(logs, workouts)).toEqual({
      checkInCount: 4,
      avgEnergy: 3,
      moodCounts: { ...noMoods, low: 1, okay: 2 },
      topSymptoms: [
        { key: "cramps", days: 2, maxSeverity: 3 },
        { key: "headache", days: 1, maxSeverity: 1 },
      ],
      moreSymptoms: 0,
      bleedingDays: 2,
      workoutCount: 2,
    });
  });

  it("counts 20 check-ins and keeps the top 3 symptoms", () => {
    const logs = Array.from({ length: 20 }, (_, index) =>
      makeLog(dayOf("2026-10-15", index + 1), {
        energy: index % 2 === 0 ? 3 : 4,
        mood: index < 12 ? "good" : "okay",
        bleeding: index < 5 ? "medium" : "none",
        symptoms: [
          { key: "fatigue", severity: 1 },
          ...(index < 8 ? [{ key: "bloating", severity: 2 } as const] : []),
          ...(index < 3 ? [{ key: "acne", severity: 1 } as const] : []),
          ...(index < 2 ? [{ key: "nausea", severity: 1 } as const] : []),
        ],
      }),
    );
    const result = summary(logs);
    expect(result).toMatchObject({ checkInCount: 20, avgEnergy: 3.5, bleedingDays: 5, moreSymptoms: 1 });
    expect(result.moodCounts).toEqual({ ...noMoods, good: 12, okay: 8 });
    expect(result.topSymptoms.map(({ key, days }) => [key, days])).toEqual([
      ["fatigue", 20],
      ["bloating", 8],
      ["acne", 3],
    ]);
  });

  it("sorts symptoms by days, then by the strongest severity", () => {
    const logs = [
      makeLog("2026-10-16", { symptoms: [{ key: "headache", severity: 1 }, { key: "insomnia", severity: 3 }] }),
      makeLog("2026-10-17", { symptoms: [{ key: "headache", severity: 1 }, { key: "insomnia", severity: 1 }] }),
      makeLog("2026-10-18", { symptoms: [{ key: "cramps", severity: 2 }] }),
    ];
    expect(summary(logs).topSymptoms.map((symptom) => symptom.key)).toEqual(["insomnia", "headache", "cramps"]);
  });

  it("uses every check-in and workout without a period", () => {
    const noData = computeCycleState({ periods: [], profile: null, logs: [], today: "2026-10-25" });
    const result = getCurrentCycleSummary([makeLog("2026-01-01"), makeLog("2026-10-25")], [makeWorkout("2026-02-01", "normal")], noData);
    expect(result).toMatchObject({ checkInCount: 2, workoutCount: 1 });
  });
});

describe("moodSummaryText", () => {
  const moods = (fields: Partial<Record<"great" | "good" | "okay" | "low" | "bad", number>>) => ({
    great: 0,
    good: 0,
    okay: 0,
    low: 0,
    bad: 0,
    ...fields,
  });

  it("names the most common mood from 3 logged moods", () => {
    expect(moodSummaryText(moods({ okay: 3, low: 1 }))).toBe("Mostly okay");
    expect(moodSummaryText(moods({ good: 1, low: 2 }))).toBe("Mostly low");
  });

  it("lists the moods below 3 logs", () => {
    expect(moodSummaryText(moods({ good: 1, low: 1 }))).toBe("Logged: good, low");
    expect(moodSummaryText(moods({ okay: 2 }))).toBe("Logged: okay");
  });

  it("is null with no mood logged", () => {
    expect(moodSummaryText(moods({}))).toBeNull();
  });
});

describe("symptomChipLabels", () => {
  it("names each symptom with its day count, and caps at 3 plus a +n more chip", () => {
    const top = [
      { key: "cramps" as const, days: 3, maxSeverity: 2 },
      { key: "headache" as const, days: 1, maxSeverity: 1 },
      { key: "fatigue" as const, days: 1, maxSeverity: 1 },
    ];
    expect(symptomChipLabels(top, 2)).toEqual(["Cramps, 3 days", "Headache, 1 day", "Fatigue, 1 day", "+2 more"]);
    expect(symptomChipLabels(top.slice(0, 1), 0)).toEqual(["Cramps, 3 days"]);
  });
});
