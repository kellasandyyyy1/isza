import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import type { Workout } from "@/db/schema";
import { daysBetween } from "./cycle";
import { computeInsights } from "./insights";
import {
  lastWorkout,
  newestFirst,
  prefersLighter,
  relativeDay,
  sessionPrefill,
  stepDuration,
  trainingProgress,
  weekDates,
  workoutFormSchema,
} from "./training";
import { dayOf, makeWorkout, periodsFromLengths } from "./testFixtures";

describe("workoutFormSchema", () => {
  const valid = { date: "2026-10-25", type: "strength", durationMin: 45, rpe: 7, feel: "strong", note: null } as const;

  it("accepts a valid workout", () => {
    expect(workoutFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects durations off the 5-minute step or out of range, effort out of range and long notes", () => {
    expect(workoutFormSchema.safeParse({ ...valid, durationMin: 42 }).success).toBe(false);
    expect(workoutFormSchema.safeParse({ ...valid, durationMin: 245 }).success).toBe(false);
    expect(workoutFormSchema.safeParse({ ...valid, rpe: 0 }).success).toBe(false);
    expect(workoutFormSchema.safeParse({ ...valid, note: "a".repeat(141) }).success).toBe(false);
  });
});

describe("stepDuration", () => {
  it("moves in 5-minute steps within 5 to 240", () => {
    expect(stepDuration(45, 1)).toBe(50);
    expect(stepDuration(5, -1)).toBe(5);
    expect(stepDuration(240, 1)).toBe(240);
  });
});

describe("newestFirst", () => {
  it("sorts by date, then by most recently added", () => {
    const workouts: Workout[] = [
      { ...makeWorkout("2026-10-20", "normal"), id: 1 },
      { ...makeWorkout("2026-10-24", "normal"), id: 2 },
      { ...makeWorkout("2026-10-24", "strong"), id: 3 },
    ];
    expect(newestFirst(workouts).map((workout) => workout.id)).toEqual([3, 2, 1]);
  });
});

describe("trainingProgress", () => {
  const periods = periodsFromLengths("2026-06-01", [28, 28, 28]);
  const starts = periods.map((period) => period.startDate);

  it("needs workouts in 2 or more completed cycles", () => {
    const oneCycle = [makeWorkout(dayOf(starts[0], 8), "strong")];
    expect(trainingProgress(periods, oneCycle, null)).toMatchObject({ cyclesWithWorkouts: 1, available: false });
    const twoCycles = [...oneCycle, makeWorkout(dayOf(starts[1], 8), "normal")];
    expect(trainingProgress(periods, twoCycles, null)).toMatchObject({ cyclesWithWorkouts: 2, available: true });
  });

  it("ignores workouts in the current cycle", () => {
    const workouts = [makeWorkout(dayOf(starts[0], 8), "strong"), makeWorkout(dayOf(starts[3], 8), "strong")];
    expect(trainingProgress(periods, workouts, null).cyclesWithWorkouts).toBe(1);
  });

  it("gives the share of strong sessions per phase", () => {
    // Follicular is days 6 to 12, ovulatory 13 to 15.
    const workouts = [
      makeWorkout(dayOf(starts[0], 8), "strong"),
      makeWorkout(dayOf(starts[0], 9), "normal"),
      makeWorkout(dayOf(starts[1], 8), "weak"),
      makeWorkout(dayOf(starts[1], 14), "strong"),
    ];
    expect(trainingProgress(periods, workouts, null).shares).toEqual([
      { phase: "menstrual", total: 0, strong: 0, percent: null },
      { phase: "follicular", total: 3, strong: 1, percent: 33 },
      { phase: "ovulatory", total: 1, strong: 1, percent: 100 },
      { phase: "luteal", total: 0, strong: 0, percent: null },
    ]);
  });
});

describe("trainingProgress with the demo data", () => {
  const demo = generateDemoData(new Date(2026, 9, 25));
  const progress = trainingProgress(demo.periods, demo.workouts, demo.profile);

  // Independent recount: each completed demo cycle has 5 menstrual days and ovulation at length minus 14.
  const expected = { menstrual: [0, 0], follicular: [0, 0], ovulatory: [0, 0], luteal: [0, 0] };
  const starts = demo.periods.map((period) => period.startDate);
  for (const workout of demo.workouts) {
    const index = starts.findLastIndex((start) => start <= workout.date);
    if (index === starts.length - 1) continue;
    const length = daysBetween(starts[index], starts[index + 1]);
    const day = daysBetween(starts[index], workout.date) + 1;
    const ovulation = length - 14;
    const phase = day <= 5 ? "menstrual" : day <= ovulation - 2 ? "follicular" : day <= ovulation + 1 ? "ovulatory" : "luteal";
    expected[phase][0] += 1;
    if (workout.feel === "strong") expected[phase][1] += 1;
  }

  it("is available with 4 completed cycles of workouts", () => {
    expect(progress).toMatchObject({ cyclesWithWorkouts: 4, available: true });
  });

  it("matches a recount of the demo workouts", () => {
    for (const share of progress.shares) {
      const [total, strong] = expected[share.phase];
      expect({ total: share.total, strong: share.strong }).toEqual({ total, strong });
      expect(share.percent).toBe(total === 0 ? null : Math.round((strong / total) * 100));
    }
  });

  it("agrees with the best training window insight", () => {
    const best = computeInsights({ periods: demo.periods, logs: demo.dailyLogs, workouts: demo.workouts, profile: demo.profile }).find(
      (insight) => insight.kind === "best-training-window",
    );
    const top = progress.shares.filter((share) => share.total >= 4).sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))[0];
    expect(best?.phase).toBe(top.phase);
    expect(best?.text).toContain(`(${top.percent}% of workouts felt strong)`);
  });
});

describe("Plan tab helpers", () => {
  it("prefills the sheet from the lower end of an effort range, within the form's ranges", () => {
    expect(sessionPrefill(45, "7 to 8")).toEqual({ durationMin: 45, rpe: 7 });
    expect(sessionPrefill(25, "8")).toEqual({ durationMin: 25, rpe: 8 });
    expect(sessionPrefill(35, 5)).toEqual({ durationMin: 35, rpe: 5 });
    // Full rest is 0 minutes at effort 0, below the form's minimum of 5 minutes and effort 1.
    expect(sessionPrefill(0, "0")).toEqual({ durationMin: 5, rpe: 1 });
    expect(sessionPrefill(0, 0)).toEqual({ durationMin: 5, rpe: 1 });
  });

  it("suggests something lighter only for strength and HIIT on a Rest day", () => {
    expect(prefersLighter("Rest", "strength")).toBe(true);
    expect(prefersLighter("Rest", "hiit")).toBe(true);
    expect(prefersLighter("Rest", "cardio")).toBe(false);
    expect(prefersLighter("Steady", "hiit")).toBe(false);
    expect(prefersLighter("Go", "strength")).toBe(false);
  });

  it("lists Monday to Sunday of today's week", () => {
    // October 25, 2026 is a Sunday, so its week starts on Monday, October 19.
    expect(weekDates("2026-10-25")).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
    expect(weekDates("2026-10-26")[0]).toBe("2026-10-26");
  });

  it("says how long ago a day was", () => {
    expect(relativeDay("2026-10-25", "2026-10-25")).toBe("today");
    expect(relativeDay("2026-10-24", "2026-10-25")).toBe("yesterday");
    expect(relativeDay("2026-10-23", "2026-10-25")).toBe("2 days ago");
    expect(relativeDay("2026-09-25", "2026-10-25")).toBe("30 days ago");
  });

  it("finds the newest workout up to today", () => {
    const older = makeWorkout("2026-10-20", "normal");
    const newer = makeWorkout("2026-10-24", "strong");
    const future = makeWorkout("2026-10-27", "weak");
    expect(lastWorkout([older, future, newer], "2026-10-25")).toBe(newer);
    expect(lastWorkout([future], "2026-10-25")).toBeNull();
    expect(lastWorkout([], "2026-10-25")).toBeNull();
  });
});
