import { describe, expect, it } from "vitest";
import { VALIDATION_ENTRIES } from "@/content/validation";
import type { DailyLog } from "@/db/schema";
import { completedCycles, type CycleState } from "./cycle";
import { computeInsights } from "./insights";
import { dayOf, makeLog, periodsFromLengths } from "./testFixtures";
import {
  DEFAULT_VALIDATION_SETTINGS,
  getValidationCard,
  recordValidationDismissed,
  recordValidationShown,
  setValidationEnabled,
  type ValidationInput,
} from "./validation";

const TODAY = "2026-10-25";

function cycleState(fields: Partial<CycleState> = {}): CycleState {
  return {
    mode: "standard",
    cycleDay: 10,
    cycleStart: "2026-10-16",
    phase: "follicular",
    isLateLuteal: false,
    nextPeriod: null,
    ovulationDay: 14,
    fertileWindow: null,
    confidence: "medium",
    cycleLengthIsEstimate: false,
    avgCycleLength: 28,
    menstrualEnd: 5,
    periodLoggedDays: 5,
    status: "ok",
    ...fields,
  };
}

function input(todayLog: DailyLog, fields: Partial<ValidationInput> = {}): ValidationInput {
  return {
    cycleState: cycleState(),
    todayLog,
    logs: [todayLog],
    insights: [],
    cycles: [],
    settings: DEFAULT_VALIDATION_SETTINGS,
    today: TODAY,
    ...fields,
  };
}

const lateLuteal = cycleState({ phase: "luteal", isLateLuteal: true, cycleDay: 25 });
const menstrual = cycleState({ phase: "menstrual", cycleDay: 2 });
const luteal = cycleState({ phase: "luteal", cycleDay: 18 });
const noPhase = cycleState({ mode: "hormonal", phase: null, ovulationDay: null });

const idFor = (log: DailyLog, state: CycleState) => getValidationCard(input(log, { cycleState: state }))?.id ?? null;

describe("general entries", () => {
  it("late-luteal-mood: a low or bad mood in the late luteal days", () => {
    expect(idFor(makeLog(TODAY, { mood: "low" }), lateLuteal)).toBe("late-luteal-mood");
    expect(idFor(makeLog(TODAY, { mood: "bad" }), lateLuteal)).toBe("late-luteal-mood");
    expect(idFor(makeLog(TODAY, { mood: "okay" }), lateLuteal)).toBeNull();
    expect(idFor(makeLog(TODAY, { mood: "low" }), luteal)).toBeNull();
  });

  it("menstrual-fatigue: fatigue at severity 2 or 3 in the menstrual phase", () => {
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "fatigue", severity: 2 }] }), menstrual)).toBe("menstrual-fatigue");
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "fatigue", severity: 3 }] }), menstrual)).toBe("menstrual-fatigue");
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "fatigue", severity: 1 }] }), menstrual)).toBeNull();
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "fatigue", severity: 3 }] }), luteal)).toBeNull();
  });

  it("menstrual-pain: cramps at severity 3 in the menstrual phase", () => {
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "cramps", severity: 3 }] }), menstrual)).toBe("menstrual-pain");
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "cramps", severity: 2 }] }), menstrual)).toBeNull();
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "cramps", severity: 3 }] }), luteal)).toBeNull();
  });

  it("luteal-irritability: irritability or anxiety at severity 2 or 3 in the luteal phase", () => {
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "irritability", severity: 2 }] }), luteal)).toBe("luteal-irritability");
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "anxiety", severity: 3 }] }), luteal)).toBe("luteal-irritability");
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "anxiety", severity: 1 }] }), luteal)).toBeNull();
    expect(idFor(makeLog(TODAY, { symptoms: [{ key: "irritability", severity: 3 }] }), menstrual)).toBeNull();
  });

  it("low-energy-no-phase: energy 1 or 2 when phases are hidden", () => {
    expect(idFor(makeLog(TODAY, { energy: 1 }), noPhase)).toBe("low-energy-no-phase");
    expect(idFor(makeLog(TODAY, { energy: 2 }), noPhase)).toBe("low-energy-no-phase");
    expect(idFor(makeLog(TODAY, { energy: 3 }), noPhase)).toBeNull();
    expect(idFor(makeLog(TODAY, { energy: 1 }), menstrual)).toBeNull();
  });

  it("returns nothing for an easy day", () => {
    expect(idFor(makeLog(TODAY, { mood: "good", energy: 4 }), lateLuteal)).toBeNull();
  });

  it("picks by priority when several match", () => {
    const log = makeLog(TODAY, { symptoms: [{ key: "fatigue", severity: 3 }, { key: "cramps", severity: 3 }] });
    expect(idFor(log, menstrual)).toBe("menstrual-pain");
  });
});

describe("personal entries", () => {
  // Five starts 28 days apart: four completed cycles. Luteal is days 16 to 28, menstrual 1 to 5.
  const periods = periodsFromLengths("2026-05-01", [28, 28, 28, 28]);
  const starts = periods.map((period) => period.startDate);
  const cycles = completedCycles(periods, null);

  it("the mood pattern replaces late-luteal-mood with real counts at 3 cycles", () => {
    const past = [0, 1, 2].map((cycle) => makeLog(dayOf(starts[cycle], 25), { mood: "low" }));
    const today = makeLog(TODAY, { mood: "low" });
    const card = getValidationCard(input(today, { cycleState: lateLuteal, logs: [...past, today], cycles }));
    expect(card).toEqual({
      id: "personal-mood-pattern",
      title: "This matches your own pattern",
      body: "A low mood has shown up in your luteal phase in 3 of your last 4 cycles.",
    });
  });

  it("the mood pattern does not show at 2 cycles", () => {
    const past = [0, 1].map((cycle) => makeLog(dayOf(starts[cycle], 25), { mood: "bad" }));
    const today = makeLog(TODAY, { mood: "low" });
    const card = getValidationCard(input(today, { cycleState: lateLuteal, logs: [...past, today], cycles }));
    expect(card?.id).toBe("late-luteal-mood");
  });

  it("the symptom pattern replaces menstrual-pain with the counts from insights at 3 cycles", () => {
    const past = [0, 1, 2].map((cycle) => makeLog(dayOf(starts[cycle], 1), { symptoms: [{ key: "cramps", severity: 2 }] }));
    const insights = computeInsights({ periods, logs: past, workouts: [], profile: null });
    const today = makeLog(TODAY, { symptoms: [{ key: "cramps", severity: 3 }] });
    const card = getValidationCard(input(today, { cycleState: menstrual, logs: [...past, today], insights, cycles }));
    expect(card).toEqual({
      id: "personal-symptom-pattern",
      title: "This matches your own pattern",
      body: "Cramps has shown up in your menstrual phase in 3 of your last 4 cycles.",
    });
  });

  it("the symptom pattern does not show at 2 cycles", () => {
    const past = [0, 1].map((cycle) => makeLog(dayOf(starts[cycle], 1), { symptoms: [{ key: "cramps", severity: 2 }] }));
    const insights = computeInsights({ periods, logs: past, workouts: [], profile: null });
    const today = makeLog(TODAY, { symptoms: [{ key: "cramps", severity: 3 }] });
    const card = getValidationCard(input(today, { cycleState: menstrual, logs: [...past, today], insights, cycles }));
    expect(card?.id).toBe("menstrual-pain");
  });

  it("the symptom pattern needs severity 2 or 3 today", () => {
    const past = [0, 1, 2].map((cycle) => makeLog(dayOf(starts[cycle], 1), { symptoms: [{ key: "cramps", severity: 2 }] }));
    const insights = computeInsights({ periods, logs: past, workouts: [], profile: null });
    const today = makeLog(TODAY, { symptoms: [{ key: "cramps", severity: 1 }] });
    expect(getValidationCard(input(today, { cycleState: menstrual, insights, cycles }))).toBeNull();
  });
});

describe("when cards show", () => {
  const log = makeLog(TODAY, { mood: "low" });

  it("shows nothing within 3 days of the last card", () => {
    for (const shown of ["2026-10-25", "2026-10-24", "2026-10-23"]) {
      const settings = { ...DEFAULT_VALIDATION_SETTINGS, lastValidationShownAt: shown };
      expect(getValidationCard(input(log, { cycleState: lateLuteal, settings })), shown).toBeNull();
    }
    const settings = { ...DEFAULT_VALIDATION_SETTINGS, lastValidationShownAt: "2026-10-22" };
    expect(getValidationCard(input(log, { cycleState: lateLuteal, settings }))?.id).toBe("late-luteal-mood");
  });

  it("logging again the next day shows nothing", () => {
    const shown = recordValidationShown(DEFAULT_VALIDATION_SETTINGS, TODAY);
    const tomorrow = makeLog("2026-10-26", { mood: "low" });
    expect(getValidationCard(input(tomorrow, { cycleState: lateLuteal, settings: shown, today: "2026-10-26" }))).toBeNull();
  });

  it("shows nothing when turned off", () => {
    const settings = { ...DEFAULT_VALIDATION_SETTINGS, validationCardsEnabled: false };
    expect(getValidationCard(input(log, { cycleState: lateLuteal, settings }))).toBeNull();
  });

  it("switches itself off after 3 dismissals", () => {
    let settings = DEFAULT_VALIDATION_SETTINGS;
    settings = recordValidationDismissed(settings);
    settings = recordValidationDismissed(settings);
    expect(settings).toMatchObject({ validationCardsEnabled: true, validationDismissCount: 2 });
    settings = recordValidationDismissed(settings);
    expect(settings).toMatchObject({ validationCardsEnabled: false, validationDismissCount: 3 });
    expect(getValidationCard(input(log, { cycleState: lateLuteal, settings }))).toBeNull();
  });

  it("turning it back on starts the dismissal count again", () => {
    const off = { ...DEFAULT_VALIDATION_SETTINGS, validationCardsEnabled: false, validationDismissCount: 3 };
    expect(setValidationEnabled(off, true)).toMatchObject({ validationCardsEnabled: true, validationDismissCount: 0 });
  });
});

describe("copy", () => {
  const BANNED = [
    "pms",
    "pmdd",
    "depress",
    "anxiety disorder",
    "diagnos",
    "disorder",
    "imbalance",
    "you should",
    "try",
    "tip",
    "recommend",
    "will feel",
    "suffer",
  ];

  it("never names a condition, gives advice or predicts feelings", () => {
    for (const entry of VALIDATION_ENTRIES) {
      const text = JSON.stringify(entry).toLowerCase();
      for (const word of BANNED) expect(text, `${entry.id} contains "${word}"`).not.toContain(word);
    }
  });

  it("keeps every body under 30 words and at most 2 sentences", () => {
    for (const { id, body } of VALIDATION_ENTRIES) {
      expect(body.split(/\s+/).length, id).toBeLessThan(30);
      expect(body.split(/[.!?](\s|$)/).filter((part) => part.trim().length > 0).length, id).toBeLessThanOrEqual(2);
    }
  });

  it("never starts a body with You", () => {
    for (const { id, body } of VALIDATION_ENTRIES) expect(body.startsWith("You"), id).toBe(false);
  });
});
