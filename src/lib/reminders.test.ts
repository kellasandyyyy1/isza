import { describe, expect, it } from "vitest";
import type { Reminder } from "@/db/schema";
import { daysSummary, dueReminders, periodPrepText, reminderFormSchema, reminderText } from "./reminders";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const reminder = (id: number, time: string, fields: Partial<Reminder> = {}): Reminder => ({
  id,
  type: "check-in",
  label: `Reminder ${id}`,
  time,
  days: EVERY_DAY,
  enabled: true,
  ...fields,
});

describe("dueReminders", () => {
  // Monday, October 26, 2026 at 09:00 local time.
  const now = new Date(2026, 9, 26, 9, 0);

  it("returns times in the last 12 hours, oldest first, including yesterday evening", () => {
    const due = dueReminders([reminder(1, "08:00"), reminder(2, "22:00"), reminder(3, "20:00")], now, null);
    expect(due.map(({ reminder: r, at }) => [r.id, at.getDate(), at.getHours()])).toEqual([
      [2, 25, 22],
      [1, 26, 8],
    ]);
  });

  it("skips future times, disabled reminders and days that are not chosen", () => {
    const due = dueReminders(
      [reminder(1, "10:00"), reminder(2, "08:00", { enabled: false }), reminder(3, "08:00", { days: [2] })],
      now,
      null,
    );
    expect(due).toEqual([]);
  });

  it("only returns times after the last check", () => {
    const since = new Date(2026, 9, 26, 7, 0);
    const due = dueReminders([reminder(1, "08:00"), reminder(2, "06:30")], now, since);
    expect(due.map(({ reminder: r }) => r.id)).toEqual([1]);
  });

  it("never looks back more than 12 hours, even after a long time away", () => {
    const since = new Date(2026, 9, 20, 9, 0);
    expect(dueReminders([reminder(1, "20:00")], now, since)).toEqual([]);
  });
});

describe("periodPrepText", () => {
  it("names the period unless discreet mode is on", () => {
    expect(periodPrepText(false)).toBe("Period likely in 2 days. Pack your supplies.");
    expect(periodPrepText(true)).not.toMatch(/period/i);
  });
});

describe("reminderText", () => {
  it("is plain in normal mode and uses the custom label", () => {
    expect(reminderText({ type: "pill", label: "Pill" }, false)).toBe("Time to take your pill");
    expect(reminderText({ type: "period-prep", label: "Prep" }, false)).toBe(
      "Your period may start soon. Pack what you need.",
    );
    expect(reminderText({ type: "custom", label: "Stretch at lunch" }, false)).toBe("Stretch at lunch");
  });

  it("never mentions periods, symptoms or the custom label in discreet mode", () => {
    for (const type of ["pill", "supplement", "period-prep", "check-in", "custom"] as const) {
      const text = reminderText({ type, label: "Period cramps pill" }, true);
      expect(text).not.toMatch(/period|cramp|symptom|bleed|pill/i);
    }
    expect(reminderText({ type: "check-in", label: "" }, true)).toBe("Time for your check-in");
  });
});

describe("daysSummary", () => {
  it("names common sets and lists the rest Monday first", () => {
    expect(daysSummary([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(daysSummary([5, 4, 3, 2, 1])).toBe("Weekdays");
    expect(daysSummary([6, 0])).toBe("Weekends");
    expect(daysSummary([0, 3, 1])).toBe("Mon, Wed, Sun");
    expect(daysSummary([])).toBe("No days");
  });
});

describe("reminderFormSchema", () => {
  const valid = { type: "check-in", label: "Check-in", time: "20:30", days: [1], enabled: true } as const;

  it("needs a label, an HH:mm time and at least one day", () => {
    expect(reminderFormSchema.safeParse(valid).success).toBe(true);
    expect(reminderFormSchema.safeParse({ ...valid, days: [] }).success).toBe(false);
    expect(reminderFormSchema.safeParse({ ...valid, time: "8:30" }).success).toBe(false);
    expect(reminderFormSchema.safeParse({ ...valid, label: " " }).success).toBe(false);
  });
});
