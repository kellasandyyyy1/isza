import { afterEach, describe, expect, it, vi } from "vitest";
import { DAILY_NOTES, type DailyNoteCard } from "@/content/daily-notes";
import { guidance, type GuidanceKey } from "@/content/guidance";
import { PHASES, type Phase } from "./cycle";
import { getDailyNote } from "./daily-notes";
import { getGuidance, type GuidanceCard } from "./guidance";
import { waterCountText } from "./water";

const PHASE_OPTIONS: (Phase | null)[] = [...PHASES, null];
const CARDS: DailyNoteCard[] = ["train", "food", "water", "energy", "sleep", "social"];
// The Water card has no phase sentence: its first line is the count.
const firstLine = (card: DailyNoteCard, phase: Phase | null) =>
  card === "water" ? waterCountText(0) : getGuidance(phase, card as GuidanceCard);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("every card in every phase has a body", () => {
  for (const phase of PHASE_OPTIONS) {
    for (const card of CARDS) {
      it(`${card}, ${phase ?? "no phase"}: a first line and a daily note`, () => {
        expect(firstLine(card, phase).trim()).not.toBe("");
        expect(getDailyNote(card, "2026-10-27", phase).text.trim()).not.toBe("");
      });
    }
  }
});

describe("guidance keys", () => {
  it("has exactly one entry per phase cycleState can return, plus neutral for no phase", () => {
    // cycleState returns one of PHASES or null; Today turns null into "neutral".
    const expected: GuidanceKey[] = [...PHASES, "neutral"];
    expect(Object.keys(guidance).sort()).toEqual([...expected].sort());
    for (const key of expected) {
      for (const card of ["train", "food", "energy", "sleep", "social"] as const) {
        expect(guidance[key][card].trim(), `${key} ${card}`).not.toBe("");
      }
    }
  });
});

describe("getGuidance fallback", () => {
  it("falls back to the neutral line for a key that does not match exactly", () => {
    expect(getGuidance("Menstrual" as Phase, "train")).toBe(guidance.neutral.train);
    expect(getGuidance(null, "sleep")).toBe(guidance.neutral.sleep);
  });

  it("warns in development, naming the card and phase", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getGuidance("Menstrual" as Phase, "food");
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"food".*"Menstrual"/));
  });

  it("never logs in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getGuidance("Menstrual" as Phase, "food");
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("getDailyNote fallback", () => {
  it("never returns undefined, even for a card name that does not match", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const note = getDailyNote("Train" as DailyNoteCard, "2026-10-27", "menstrual");
    expect(note.text.trim()).not.toBe("");
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"Train".*"menstrual"/));
  });

  it("uses the unrestricted pool when a phase has nothing of its own", () => {
    for (const card of CARDS) {
      const unrestricted = DAILY_NOTES[card].filter((note) => !note.phases).map((note) => note.id);
      expect(unrestricted).toContain(getDailyNote(card, "2026-10-27", null).id);
    }
  });
});
