import { describe, expect, it } from "vitest";
import { DAILY_NOTES, type DailyNoteCard } from "@/content/daily-notes";
import { PHASES, shiftDate, type Phase } from "./cycle";
import { eligibleNotes, getDailyNote } from "./daily-notes";

const CARDS = Object.keys(DAILY_NOTES) as DailyNoteCard[];
const PHASE_OPTIONS: (Phase | null)[] = [...PHASES, null];
const days = (count: number) => Array.from({ length: count }, (_, index) => shiftDate("2026-11-01", index));

describe("the daily notes", () => {
  it("has 30 water notes and 20 for each other card, with unique ids", () => {
    expect(DAILY_NOTES.water).toHaveLength(30);
    for (const card of CARDS.filter((name) => name !== "water")) expect(DAILY_NOTES[card], card).toHaveLength(20);
    const ids = CARDS.flatMap((card) => DAILY_NOTES[card].map((note) => note.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every card at least one unrestricted note, so no phase can leave a pool empty", () => {
    for (const card of CARDS) expect(DAILY_NOTES[card].some((note) => !note.phases), card).toBe(true);
  });

  it("leaves enough notes open to every phase", () => {
    for (const card of CARDS) {
      const open = DAILY_NOTES[card].filter((note) => !note.phases).length;
      expect(open, card).toBeGreaterThanOrEqual(card === "water" ? 20 : 12);
      for (const phase of PHASES) expect(eligibleNotes(card, phase).length, `${card} ${phase}`).toBeGreaterThanOrEqual(12);
    }
  });

  it("uses only unrestricted notes without a phase", () => {
    for (const card of CARDS) {
      const pool = eligibleNotes(card, null);
      expect(pool.every((note) => !note.phases), card).toBe(true);
      for (const date of days(40)) expect(getDailyNote(card, date, null).phases, card).toBeUndefined();
    }
  });

  it("only shows a phase note in its own phase", () => {
    for (const card of CARDS) {
      for (const phase of PHASES) {
        for (const date of days(30)) {
          const { phases } = getDailyNote(card, date, phase);
          if (phases) expect(phases, `${card} ${phase}`).toContain(phase);
        }
      }
    }
  });
});

describe("getDailyNote", () => {
  it("gives the same note for the same card and date, every time", () => {
    for (const card of CARDS) expect(getDailyNote(card, "2026-10-27", "luteal")).toEqual(getDailyNote(card, "2026-10-27", "luteal"));
  });

  it("gives different cards different notes on the same date", () => {
    const texts = CARDS.map((card) => getDailyNote(card, "2026-10-27", "follicular").text);
    expect(new Set(texts).size).toBe(CARDS.length);
  });

  it("rotates: at least 15 distinct notes over 20 days per card, in every phase", () => {
    for (const card of CARDS) {
      for (const phase of PHASE_OPTIONS) {
        const notes = days(20).map((date) => getDailyNote(card, date, phase).id);
        expect(new Set(notes).size, `${card} ${phase}`).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it("rotates water: at least 25 distinct notes over 30 days", () => {
    for (const phase of PHASE_OPTIONS) {
      const notes = days(30).map((date) => getDailyNote("water", date, phase).id);
      expect(new Set(notes).size, `${phase}`).toBeGreaterThanOrEqual(25);
    }
  });

  it("changes from one day to the next", () => {
    for (const card of CARDS) {
      const [today, tomorrow] = days(2).map((date) => getDailyNote(card, date, "menstrual").id);
      expect(tomorrow, card).not.toBe(today);
    }
  });
});

describe("daily note copy", () => {
  const BANNED = [
    "you should",
    "drink more",
    "you need",
    "make sure",
    "don't forget",
    "try to",
    "behind",
    "target",
    "goal",
    "must",
    "dehydrat",
    "cures",
    "treats",
    "prevents",
    "calorie",
    "kcal",
    "lose weight",
    "portion",
    "glasses a day",
    "liters",
  ];
  // Stronger than "supports", "helps" or "is part of": not allowed either.
  const STRONG_VERBS = /\b(boosts?|improves?|reduces?|fix(es)?|heals?|cures?|lowers?|increases?|burns?)\b/i;

  // Water lines are gentle reminders to have a glass, so they may say "don't forget".
  const WATER_ALLOWED = ["don't forget"];

  for (const card of CARDS) {
    it(`keeps every ${card} note short, single and benefit-framed`, () => {
      const banned = card === "water" ? BANNED.filter((word) => !WATER_ALLOWED.includes(word)) : BANNED;
      for (const { id, text } of DAILY_NOTES[card]) {
        for (const word of banned) expect(text.toLowerCase(), `${id}: ${word}`).not.toContain(word);
        expect(text, id).not.toMatch(STRONG_VERBS);
        expect(text.split(/\s+/).length, id).toBeLessThanOrEqual(12);
        // One sentence: a single full stop, at the end, and no other sentence marks.
        expect(text, id).toMatch(/^[^.!?]+\.$/);
      }
    });
  }
});
