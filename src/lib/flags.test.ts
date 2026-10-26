import { describe, expect, it } from "vitest";
import type { DailyLog, DismissedFlag, Period, Profile } from "@/db/schema";
import { computeCycleState } from "./cycle";
import { computeFlags, type FlagId } from "./flags";
import { dayOf, makeLog, makeProfile, periodsFromLengths } from "./testFixtures";

interface Setup {
  periods: Period[];
  logs?: DailyLog[];
  profile?: Profile | null;
  dismissed?: DismissedFlag[];
  // Defaults to day 10 of the latest cycle.
  today?: string;
}

function flagIds({ periods, logs = [], profile = null, dismissed = [], today }: Setup): FlagId[] {
  const day = today ?? dayOf(periods[periods.length - 1].startDate, 10);
  const cycle = computeCycleState({ periods, profile, logs, today: day });
  return computeFlags({ cycle, periods, logs, profile, dismissedFlags: dismissed, today: day }).map((flag) => flag.id);
}

const regular = periodsFromLengths("2026-06-01", [28, 28, 28]);
const latestStart = regular[regular.length - 1].startDate;

describe("baseline", () => {
  it("raises no flags for regular cycles", () => {
    expect(flagIds({ periods: regular })).toEqual([]);
  });

  it("raises no flags without periods", () => {
    const cycle = computeCycleState({ periods: [], profile: null, logs: [], today: "2026-10-25" });
    expect(computeFlags({ cycle, periods: [], logs: [], profile: null, dismissedFlags: [], today: "2026-10-25" })).toEqual([]);
  });

  it("ends every body with the doctor line", () => {
    const periods = periodsFromLengths("2026-03-01", [40, 40], 9);
    const cycle = computeCycleState({ periods, profile: null, logs: [], today: "2026-07-01" });
    const flags = computeFlags({ cycle, periods, logs: [], profile: null, dismissedFlags: [], today: "2026-07-01" });
    expect(flags.length).toBeGreaterThan(0);
    for (const flag of flags) expect(flag.body.endsWith("Consider talking to a doctor.")).toBe(true);
  });
});

describe("cycle-length", () => {
  it("flags two short cycles", () => {
    expect(flagIds({ periods: periodsFromLengths("2026-07-01", [28, 19, 18]) })).toContain("cycle-length");
  });

  it("flags two long cycles", () => {
    expect(flagIds({ periods: periodsFromLengths("2026-03-01", [28, 40, 38]) })).toContain("cycle-length");
  });

  it("does not flag one short and one normal cycle", () => {
    expect(flagIds({ periods: periodsFromLengths("2026-07-01", [19, 28]) })).not.toContain("cycle-length");
  });
});

describe("long-period", () => {
  it("flags a latest period of 8 days", () => {
    expect(flagIds({ periods: periodsFromLengths("2026-06-01", [28, 28], 8) })).toContain("long-period");
  });

  it("does not flag 7 days", () => {
    expect(flagIds({ periods: periodsFromLengths("2026-06-01", [28, 28], 7) })).not.toContain("long-period");
  });
});

describe("heavy-flow", () => {
  it("flags very heavy flow on 2 days of the latest period", () => {
    const logs = [1, 2].map((day) => makeLog(dayOf(latestStart, day), { bleeding: "very-heavy" }));
    expect(flagIds({ periods: regular, logs })).toContain("heavy-flow");
  });

  it("does not flag 1 day, or days in an earlier period", () => {
    const logs = [
      makeLog(dayOf(latestStart, 1), { bleeding: "very-heavy" }),
      makeLog(dayOf(regular[1].startDate, 1), { bleeding: "very-heavy" }),
    ];
    expect(flagIds({ periods: regular, logs })).not.toContain("heavy-flow");
  });
});

describe("severe-pain", () => {
  const cramps = (date: string, severity: 2 | 3) => makeLog(date, { symptoms: [{ key: "cramps", severity }] });

  it("flags severe cramps in 2 of the last 3 cycles", () => {
    const logs = [cramps(dayOf(regular[2].startDate, 1), 3), cramps(dayOf(latestStart, 2), 3)];
    expect(flagIds({ periods: regular, logs })).toContain("severe-pain");
  });

  it("does not flag 1 cycle, older cycles, or severity 2", () => {
    const logs = [
      cramps(dayOf(regular[0].startDate, 1), 3),
      cramps(dayOf(regular[2].startDate, 1), 3),
      cramps(dayOf(latestStart, 1), 2),
    ];
    expect(flagIds({ periods: regular, logs })).not.toContain("severe-pain");
  });
});

describe("missed-period", () => {
  const single = [{ id: 1, startDate: "2026-08-01", endDate: "2026-08-05" }];

  it("flags 60 days since the latest start", () => {
    expect(flagIds({ periods: single, today: "2026-09-30" })).toContain("missed-period");
  });

  it("does not flag 59 days", () => {
    expect(flagIds({ periods: single, today: "2026-09-29" })).not.toContain("missed-period");
  });
});

describe("spotting-between", () => {
  it("flags 3 bleeding days after the menstrual phase", () => {
    const logs = [7, 8, 9].map((day) => makeLog(dayOf(latestStart, day), { bleeding: "spotting" }));
    expect(flagIds({ periods: regular, logs })).toContain("spotting-between");
  });

  it("does not flag 2 days, or bleeding inside the menstrual phase", () => {
    const logs = [
      ...[1, 2, 3, 4, 5].map((day) => makeLog(dayOf(latestStart, day), { bleeding: "light" })),
      ...[7, 8].map((day) => makeLog(dayOf(latestStart, day), { bleeding: "spotting" })),
    ];
    expect(flagIds({ periods: regular, logs })).not.toContain("spotting-between");
  });
});

describe("hormonal mode and dismissals", () => {
  it("skips cycle-based flags in hormonal mode but keeps flow flags", () => {
    const periods = periodsFromLengths("2026-03-01", [28, 19, 18], 9);
    const latest = periods[periods.length - 1].startDate;
    const logs = [
      ...[1, 2].map((day) => makeLog(dayOf(latest, day), { bleeding: "very-heavy" })),
      ...[11, 12, 13].map((day) => makeLog(dayOf(latest, day), { bleeding: "spotting" })),
    ];
    const today = dayOf(latest, 70);
    expect(flagIds({ periods, logs, today })).toEqual(
      expect.arrayContaining(["cycle-length", "missed-period", "spotting-between", "heavy-flow", "long-period"]),
    );
    expect(flagIds({ periods, logs, today, profile: makeProfile({ contraception: "hormonal" }) }).sort()).toEqual([
      "heavy-flow",
      "long-period",
    ]);
  });

  it("hides a flag dismissed until a future date", () => {
    const periods = periodsFromLengths("2026-06-01", [28, 28], 8);
    const today = dayOf(periods[2].startDate, 10);
    expect(flagIds({ periods, today, dismissed: [{ id: "long-period", until: "2026-08-20" }] })).not.toContain(
      "long-period",
    );
  });

  it("shows it again once the dismissal date is today or past", () => {
    const periods = periodsFromLengths("2026-06-01", [28, 28], 8);
    const today = dayOf(periods[2].startDate, 10);
    expect(flagIds({ periods, today, dismissed: [{ id: "long-period", until: today }] })).toContain("long-period");
  });
});
