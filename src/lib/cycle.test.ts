import { describe, expect, it } from "vitest";
import type { DailyLog, Profile } from "@/db/schema";
import { computeCycleState, cycleLengths, detectBbtShift } from "./cycle";
import { dayOf, makeLog, makeProfile, periodsFromLengths } from "./testFixtures";

// Starts 2026-06-01, 06-29, 07-27, 08-24.
const regular = periodsFromLengths("2026-06-01", [28, 28, 28]);
const regularStart = "2026-08-24";

function stateOn(cycleDay: number, logs: DailyLog[] = [], profile: Profile | null = null, periods = regular) {
  const start = periods[periods.length - 1].startDate;
  return computeCycleState({ periods, profile, logs, today: dayOf(start, cycleDay) });
}

describe("28-day regular cycles", () => {
  it("day 1 is menstrual", () => {
    expect(stateOn(1)).toMatchObject({ mode: "standard", cycleDay: 1, phase: "menstrual", isLateLuteal: false });
  });

  it("day 10 is follicular", () => {
    expect(stateOn(10).phase).toBe("follicular");
  });

  it("day 14 is ovulatory and the predicted ovulation day", () => {
    expect(stateOn(14)).toMatchObject({ phase: "ovulatory", ovulationDay: 14 });
  });

  it("day 20 is luteal but not late luteal", () => {
    expect(stateOn(20)).toMatchObject({ phase: "luteal", isLateLuteal: false });
  });

  it("day 25 is late luteal", () => {
    expect(stateOn(25)).toMatchObject({ phase: "luteal", isLateLuteal: true });
  });

  it("predicts the next period with a range of at least 1 day", () => {
    expect(stateOn(10).nextPeriod).toEqual({ start: "2026-09-21", earliest: "2026-09-20", latest: "2026-09-22" });
  });

  it("puts the fertile window from ovulation minus 5 to plus 1", () => {
    expect(stateOn(10).fertileWindow).toEqual({ start: "2026-09-01", end: "2026-09-07" });
  });

  it("has high confidence with 3 lengths and low spread", () => {
    expect(stateOn(10)).toMatchObject({ confidence: "high", status: "ok" });
  });
});

describe("ovulation overrides", () => {
  it("a positive LH test on day 16 moves ovulationDay to 17", () => {
    const logs = [
      makeLog(dayOf(regularStart, 14), { lhTest: "negative" }),
      makeLog(dayOf(regularStart, 16), { lhTest: "positive" }),
    ];
    expect(stateOn(20, logs)).toMatchObject({ ovulationDay: 17, phase: "luteal" });
    expect(stateOn(17, logs).phase).toBe("ovulatory");
  });

  it("ignores LH tests from a previous cycle", () => {
    const logs = [makeLog("2026-08-10", { lhTest: "positive" })];
    expect(stateOn(20, logs).ovulationDay).toBe(14);
  });

  // 30-day cycles predict ovulation on day 16, so a detected shift is easy to tell apart.
  const long = periodsFromLengths("2026-05-01", [30, 30, 30]);
  const longStart = long[long.length - 1].startDate;
  const bbtLogs = (temps: number[]) => temps.map((bbt, index) => makeLog(dayOf(longStart, index + 1), { bbt }));
  const flat = Array<number>(12).fill(36.3);

  it("detects a BBT shift of 3 high days and sets ovulation the day before", () => {
    const logs = bbtLogs([...flat, 36.5, 36.5, 36.6, 36.6]);
    expect(detectBbtShift(logs, longStart, dayOf(longStart, 20))).toBe(13);
    expect(stateOn(20, logs, null, long).ovulationDay).toBe(12);
  });

  it("needs 3 high days in a row", () => {
    const logs = bbtLogs([...flat, 36.5, 36.5, 36.3, 36.3]);
    expect(detectBbtShift(logs, longStart, dayOf(longStart, 20))).toBeNull();
    expect(stateOn(20, logs, null, long).ovulationDay).toBe(16);
  });

  it("needs a rise of at least 0.2 C", () => {
    const logs = bbtLogs([...flat, 36.45, 36.45, 36.45]);
    expect(detectBbtShift(logs, longStart, dayOf(longStart, 20))).toBeNull();
  });

  it("needs all 6 baseline days logged", () => {
    const temps: (number | null)[] = [...flat, 36.5, 36.5, 36.5];
    temps[9] = null;
    const logs = temps.map((bbt, index) => makeLog(dayOf(longStart, index + 1), { bbt }));
    expect(detectBbtShift(logs, longStart, dayOf(longStart, 20))).toBeNull();
  });

  it("prefers a positive LH test over a BBT shift", () => {
    const logs = bbtLogs([...flat, 36.5, 36.5, 36.6, 36.6]);
    logs[17] = makeLog(dayOf(longStart, 18), { lhTest: "positive" });
    expect(stateOn(20, logs, null, long).ovulationDay).toBe(19);
  });
});

describe("modes", () => {
  it("hormonal contraception returns phase null but still predicts", () => {
    for (const contraception of ["hormonal", "iud-hormonal"] as const) {
      const state = stateOn(10, [], makeProfile({ contraception }));
      expect(state).toMatchObject({ mode: "hormonal", phase: null, ovulationDay: null, fertileWindow: null });
      expect(state.nextPeriod?.start).toBe("2026-09-21");
    }
  });

  it("a copper IUD stays in standard mode", () => {
    expect(stateOn(10, [], makeProfile({ contraception: "iud-copper" })).mode).toBe("standard");
  });

  it("lengths 22, 40, 26 trigger irregular mode", () => {
    const periods = periodsFromLengths("2026-05-01", [22, 40, 26]);
    const state = stateOn(10, [], null, periods);
    expect(state).toMatchObject({ mode: "irregular", phase: null, ovulationDay: null, fertileWindow: null, confidence: "low" });
    expect(state.nextPeriod).not.toBeNull();
  });

  it("uses the widest range of 7 days when the spread is large", () => {
    const periods = periodsFromLengths("2026-05-01", [22, 40, 26]);
    const { nextPeriod } = stateOn(10, [], null, periods);
    // Latest start 07-28, average 29.3 rounds to 29, population sd 7.7 rounds to 8 and clamps to 7.
    expect(nextPeriod).toEqual({ start: "2026-08-26", earliest: "2026-08-19", latest: "2026-09-02" });
  });

  it("no periods returns no-data", () => {
    expect(computeCycleState({ periods: [], profile: null, logs: [], today: "2026-10-25" })).toEqual({
      mode: "no-data",
      cycleDay: null,
      cycleStart: null,
      phase: null,
      isLateLuteal: false,
      nextPeriod: null,
      ovulationDay: null,
      fertileWindow: null,
      confidence: "low",
      cycleLengthIsEstimate: true,
      avgCycleLength: null,
      menstrualEnd: null,
      periodLoggedDays: null,
      status: "no-data",
    });
  });

  it("calls the cycle length an estimate until 2 valid lengths exist", () => {
    const one = periodsFromLengths("2026-08-28", [28]);
    const two = periodsFromLengths("2026-07-31", [28, 28]);
    const state = (periods: typeof one) => computeCycleState({ periods, profile: null, logs: [], today: "2026-10-01" });
    expect(state(one).cycleLengthIsEstimate).toBe(true);
    expect(state(two).cycleLengthIsEstimate).toBe(false);
  });
});

describe("late period", () => {
  it("sets status late after the latest predicted day and keeps luteal", () => {
    expect(stateOn(31)).toMatchObject({ status: "late", phase: "luteal", cycleDay: 31, isLateLuteal: false });
  });

  it("is not late on the latest predicted day", () => {
    expect(stateOn(30).status).toBe("ok");
  });
});

describe("averages and defaults", () => {
  it("excludes lengths under 15 or over 90", () => {
    const periods = periodsFromLengths("2026-01-01", [28, 120, 28, 10]);
    expect(cycleLengths(periods)).toEqual([28, 120, 28, 10]);
    const state = stateOn(1, [], null, periods);
    expect(state.nextPeriod?.start).toBe(dayOf(periods[4].startDate, 29));
  });

  it("uses the profile's typical cycle length with one period", () => {
    const periods = [{ id: 1, startDate: "2026-10-01", endDate: null }];
    const state = stateOn(3, [], makeProfile({ typicalCycleLength: 32 }), periods);
    expect(state).toMatchObject({
      nextPeriod: { start: "2026-11-02", earliest: "2026-10-30", latest: "2026-11-05" },
      confidence: "medium",
    });
  });

  it("falls back to 28 days and low confidence", () => {
    const periods = [{ id: 1, startDate: "2026-10-01", endDate: null }];
    expect(stateOn(3, [], null, periods)).toMatchObject({ nextPeriod: { start: "2026-10-29" }, confidence: "low" });
  });

  it("never predicts ovulation earlier than period length plus 2", () => {
    const periods = [{ id: 1, startDate: "2026-10-01", endDate: null }];
    const profile = makeProfile({ typicalCycleLength: 18, typicalPeriodLength: 5 });
    expect(stateOn(3, [], profile, periods).ovulationDay).toBe(7);
  });

  it("ends the menstrual phase on the logged end date", () => {
    const periods = periodsFromLengths("2026-06-01", [28, 28, 28]);
    periods[3] = { ...periods[3], endDate: dayOf(periods[3].startDate, 3) };
    expect(stateOn(4, [], null, periods).phase).toBe("follicular");
    expect(stateOn(3, [], null, periods).phase).toBe("menstrual");
  });
});
