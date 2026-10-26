import { describe, expect, it } from "vitest";
import type { Period, SymptomEntry } from "@/db/schema";
import {
  checkInSchema,
  cycleSymptom,
  draftFromLog,
  isToggleInitiallyOn,
  parseTemperature,
  periodChangeFor,
  periodToggleFor,
  stepSleep,
  symptomLevel,
} from "./checkin";
import { makeLog } from "./testFixtures";

const DATE = "2026-10-25";

describe("draftFromLog", () => {
  it("starts empty without a log", () => {
    expect(draftFromLog(null)).toEqual({
      bleeding: "none",
      energy: null,
      mood: null,
      symptoms: [],
      sleepHours: null,
      bbt: null,
      lhTest: null,
      note: null,
    });
  });

  it("pre-fills from an existing log", () => {
    const log = makeLog(DATE, { bleeding: "light", energy: 4, mood: "good", sleepHours: 7.5, note: "Ok" });
    expect(draftFromLog(log)).toMatchObject({ bleeding: "light", energy: 4, mood: "good", sleepHours: 7.5, note: "Ok" });
  });
});

describe("checkInSchema", () => {
  const valid = draftFromLog(null);

  it("accepts a valid draft", () => {
    expect(checkInSchema.safeParse({ ...valid, sleepHours: 7.5, bbt: 36.6 }).success).toBe(true);
  });

  it("rejects sleep off the half hour or above 14", () => {
    expect(checkInSchema.safeParse({ ...valid, sleepHours: 7.25 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...valid, sleepHours: 14.5 }).success).toBe(false);
  });

  it("rejects a temperature outside 35.0 to 38.5 and a note over 280 characters", () => {
    expect(checkInSchema.safeParse({ ...valid, bbt: 38.6 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...valid, note: "a".repeat(281) }).success).toBe(false);
  });
});

describe("cycleSymptom", () => {
  it("moves off, mild, moderate, severe, off", () => {
    let symptoms: SymptomEntry[] = [];
    const levels = [];
    for (let tap = 0; tap < 4; tap++) {
      symptoms = cycleSymptom(symptoms, "cramps");
      levels.push(symptomLevel(symptoms, "cramps"));
    }
    expect(levels).toEqual([1, 2, 3, 0]);
    expect(symptoms).toEqual([]);
  });

  it("leaves other symptoms alone", () => {
    const symptoms: SymptomEntry[] = [{ key: "acne", severity: 2 }];
    expect(cycleSymptom(symptoms, "cramps")).toEqual([
      { key: "acne", severity: 2 },
      { key: "cramps", severity: 1 },
    ]);
  });
});

describe("stepSleep", () => {
  it("starts at 7 from not set, then moves in half hours within 0 to 14", () => {
    expect(stepSleep(null, 1)).toBe(7);
    expect(stepSleep(null, -1)).toBe(7);
    expect(stepSleep(7, 1)).toBe(7.5);
    expect(stepSleep(0, -1)).toBe(0);
    expect(stepSleep(14, 1)).toBe(14);
  });
});

describe("parseTemperature", () => {
  it("treats empty as not logged", () => {
    expect(parseTemperature("  ")).toEqual({ value: null, error: null });
  });

  it("reads dots and commas", () => {
    expect(parseTemperature("36.6")).toEqual({ value: 36.6, error: null });
    expect(parseTemperature("36,45")).toEqual({ value: 36.45, error: null });
  });

  it("explains bad input", () => {
    expect(parseTemperature("warm").error).toBe("Enter a number, like 36.5.");
    expect(parseTemperature("39").error).toBe("Use a value from 35.0 to 38.5.");
  });
});

describe("period switch", () => {
  const closed: Period = { id: 1, startDate: "2026-09-28", endDate: "2026-10-02" };

  it("offers 'started' with no open period", () => {
    const toggle = periodToggleFor([closed], DATE);
    expect(toggle).toEqual({ kind: "start", savedPeriodId: null });
    expect(isToggleInitiallyOn(toggle)).toBe(false);
    expect(periodChangeFor(toggle, true, DATE)).toEqual({ type: "start", startDate: DATE });
    expect(periodChangeFor(toggle, false, DATE)).toEqual({ type: "none" });
  });

  it("is on when a period starts on this date, and off removes it", () => {
    const toggle = periodToggleFor([closed, { id: 2, startDate: DATE, endDate: null }], DATE);
    expect(toggle).toEqual({ kind: "start", savedPeriodId: 2 });
    expect(isToggleInitiallyOn(toggle)).toBe(true);
    expect(periodChangeFor(toggle, true, DATE)).toEqual({ type: "none" });
    expect(periodChangeFor(toggle, false, DATE)).toEqual({ type: "remove", periodId: 2 });
  });

  it("offers 'ended' while a period is open", () => {
    const toggle = periodToggleFor([{ id: 3, startDate: "2026-10-21", endDate: null }], DATE);
    expect(toggle).toEqual({ kind: "end", periodId: 3, endsOnDate: false });
    expect(periodChangeFor(toggle, true, DATE)).toEqual({ type: "end", periodId: 3, endDate: DATE });
  });

  it("is on when the period ends on this date, and off reopens it", () => {
    const toggle = periodToggleFor([{ id: 3, startDate: "2026-10-21", endDate: DATE }], DATE);
    expect(toggle).toEqual({ kind: "end", periodId: 3, endsOnDate: true });
    expect(isToggleInitiallyOn(toggle)).toBe(true);
    expect(periodChangeFor(toggle, false, DATE)).toEqual({ type: "reopen", periodId: 3 });
  });

  it("ignores periods that start after the date", () => {
    expect(periodToggleFor([{ id: 4, startDate: "2026-10-30", endDate: null }], DATE)).toEqual({
      kind: "start",
      savedPeriodId: null,
    });
  });
});
