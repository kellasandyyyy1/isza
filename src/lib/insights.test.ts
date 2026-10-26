import { describe, expect, it } from "vitest";
import type { DailyLog, Workout } from "@/db/schema";
import { computeInsights } from "./insights";
import { dayOf, makeLog, makeWorkout, periodsFromLengths } from "./testFixtures";

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
