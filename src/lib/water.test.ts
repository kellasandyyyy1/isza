import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { waterNote } from "@/content/guidance";
import {
  DEFAULT_WATER_SETTINGS,
  latestDueWaterReminder,
  localDateKey,
  nextWaterCount,
  shouldSuppressWaterReminder,
  waterCountText,
  waterInsightLine,
  waterReminderTimes,
} from "./water";

const minutesAgo = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

describe("the tally", () => {
  it("counts up and down, never below 0", () => {
    expect(nextWaterCount(0, 1)).toBe(1);
    expect(nextWaterCount(4, -1)).toBe(3);
    expect(nextWaterCount(0, -1)).toBe(0);
  });

  it("states the count plainly, with no target", () => {
    expect(waterCountText(0)).toBe("No glasses logged yet");
    expect(waterCountText(1)).toBe("1 glass today");
    expect(waterCountText(4)).toBe("4 glasses today");
    expect(waterCountText(12)).toBe("12 glasses today");
  });
});

describe("waterReminderTimes", () => {
  it("gives exactly 5 times for 08:00 to 20:00 every 3 hours", () => {
    expect(waterReminderTimes("08:00", "20:00", 3)).toEqual(["08:00", "11:00", "14:00", "17:00", "20:00"]);
  });

  it("caps at 5 a day", () => {
    expect(waterReminderTimes("08:00", "20:00", 2)).toEqual(["08:00", "10:00", "12:00", "14:00", "16:00"]);
    expect(waterReminderTimes("08:00", "20:00", 4)).toEqual(["08:00", "12:00", "16:00", "20:00"]);
  });

  it("gives none when the window ends before it starts", () => {
    expect(waterReminderTimes("20:00", "08:00", 3)).toEqual([]);
  });
});

describe("suppression", () => {
  const now = new Date(2026, 9, 27, 14, 0);

  it("stays quiet after a glass 30 minutes ago, and shows after 90 minutes", () => {
    expect(shouldSuppressWaterReminder({ count: 3, updatedAt: minutesAgo(now, 30) }, now)).toBe(true);
    expect(shouldSuppressWaterReminder({ count: 3, updatedAt: minutesAgo(now, 90) }, now)).toBe(false);
  });

  it("shows with no log, or with nothing logged", () => {
    expect(shouldSuppressWaterReminder(null, now)).toBe(false);
    expect(shouldSuppressWaterReminder({ count: 0, updatedAt: minutesAgo(now, 5) }, now)).toBe(false);
  });

  it("uses the local date for today's log", () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("the in-app reminder", () => {
  const on = { ...DEFAULT_WATER_SETTINGS, waterRemindersEnabled: true };

  it("is the latest time that passed since the last check, at most one", () => {
    const now = new Date(2026, 9, 27, 15, 0);
    expect(latestDueWaterReminder(on, now, new Date(2026, 9, 27, 9, 0))).toEqual(new Date(2026, 9, 27, 14, 0));
    expect(latestDueWaterReminder(on, now, new Date(2026, 9, 27, 14, 30))).toBeNull();
  });

  it("is off unless reminders are on", () => {
    const now = new Date(2026, 9, 27, 15, 0);
    expect(latestDueWaterReminder(DEFAULT_WATER_SETTINGS, now, null)).toBeNull();
  });

  it("starts off by default", () => {
    expect(DEFAULT_WATER_SETTINGS).toMatchObject({
      waterRemindersEnabled: false,
      waterWindowStart: "08:00",
      waterWindowEnd: "20:00",
      waterIntervalHours: 3,
      waterGlassMl: 250,
    });
  });
});

describe("waterInsightLine", () => {
  const days = (count: number, everyNth = 1) =>
    Array.from({ length: count }, (_, index) => localDateKey(new Date(2026, 9, 1 + index * everyNth)));

  it("says nothing before 14 logged days", () => {
    expect(waterInsightLine(days(13), "2026-10-13")).toBeNull();
  });

  it("says most days or some days, and nothing more", () => {
    expect(waterInsightLine(days(14), "2026-10-14")).toBe("You log water on most days");
    expect(waterInsightLine(days(14, 3), "2026-11-10")).toBe("You log water some days");
  });
});

describe("water copy", () => {
  const BANNED = [
    "goal",
    "target",
    "dehydrat",
    "you should",
    "behind",
    "failed",
    "streak",
    "daily requirement",
    "8 glasses",
    "liters a day",
    "must drink",
  ];
  // The one required line that names a target only to say there is none.
  const ALLOWED = "Iszacycle does not set a daily target.";
  const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
  const files = [
    "src/lib/water.ts",
    "supabase/migrations/0004_water_reminder_type.sql",
    ...readdirSync(join(process.cwd(), "src/components/water")).map((file) => `src/components/water/${file}`),
  ];

  // The strings a person can read: quoted and template strings and JSX text. Code (such as event.target)
  // and comments are not copy.
  const strings = (source: string) =>
    [...source.matchAll(/"(?:[^"\\\n]|\\.)*"|`[^`]*`|>([^<>{}]+)</g)].map((match) => match[1] ?? match[0]);

  for (const path of files) {
    it(`has no target, guilt or health-claim language in ${path}`, () => {
      const text = strings(read(path)).join("\n").replaceAll(ALLOWED, "").toLowerCase();
      for (const word of BANNED) expect(text, word).not.toContain(word);
    });
  }

  it("finds the copy it checks", () => {
    const text = strings(read("src/components/water/WaterSettingsSection.tsx")).join("\n");
    expect(text).toContain("Turn on notifications to get these when the app is closed.");
    expect(text).toContain(ALLOWED);
  });

  it("keeps the water notes and the reminder text free of it too", () => {
    const strings = [...Object.values(waterNote).filter((note) => note !== null), "Time for a glass of water."];
    for (const text of strings) for (const word of BANNED) expect(text.toLowerCase(), word).not.toContain(word);
  });

  it("keeps every water note under 15 words, with none for follicular and neutral", () => {
    for (const note of Object.values(waterNote)) if (note) expect(note.split(/\s+/).length).toBeLessThan(15);
    expect(waterNote.follicular).toBeNull();
    expect(waterNote.neutral).toBeNull();
  });
});
