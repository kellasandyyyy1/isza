import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import type { Reminder } from "@/db/schema";
import type { CycleState } from "./cycle";
import { buildSyncBody, plannerPushReminder, recurringPushReminders, urlBase64ToUint8Array } from "./push-client";
import { syncBodySchema } from "./pushApi";
import { makeProfile } from "./testFixtures";

const reminder = (id: number, fields: Partial<Reminder> = {}): Reminder => ({
  id,
  type: "check-in",
  label: "Evening check-in with a private note",
  time: "20:30",
  days: [5, 1, 3],
  enabled: true,
  ...fields,
});

describe("urlBase64ToUint8Array", () => {
  it("decodes base64url with or without padding", () => {
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([1, 2, 3]);
    expect(Array.from(urlBase64ToUint8Array("-_8"))).toEqual([251, 255]);
  });
});

describe("recurringPushReminders", () => {
  it("sends only type, time and days, never the label", () => {
    const result = recurringPushReminders([reminder(1), reminder(2, { type: "period-prep" }), reminder(3, { enabled: false })]);
    expect(result).toEqual([
      { kind: "recurring", reminderType: "check-in", timeLocal: "20:30", days: [1, 3, 5] },
      { kind: "recurring", reminderType: "planner", timeLocal: "20:30", days: [1, 3, 5] },
    ]);
    expect(JSON.stringify(result)).not.toContain("note");
  });
});

describe("plannerPushReminder", () => {
  const cycle = (mode: CycleState["mode"], start: string | null) =>
    ({ mode, nextPeriod: start ? { start, earliest: start, latest: start } : null }) as CycleState;
  const now = new Date(2026, 9, 26, 9, 0);

  it("is 08:00 local time, 2 days before the predicted start", () => {
    expect(plannerPushReminder(cycle("standard", "2026-11-13"), now)).toEqual({
      kind: "once",
      reminderType: "planner",
      sendAt: new Date(2026, 10, 11, 8, 0).toISOString(),
    });
  });

  it("is skipped in hormonal or irregular mode, without a prediction, or once the time has passed", () => {
    expect(plannerPushReminder(cycle("hormonal", "2026-11-13"), now)).toBeNull();
    expect(plannerPushReminder(cycle("irregular", "2026-11-13"), now)).toBeNull();
    expect(plannerPushReminder(cycle("no-data", null), now)).toBeNull();
    expect(plannerPushReminder(cycle("standard", "2026-10-28"), now)).toBeNull();
  });
});

describe("buildSyncBody", () => {
  const demo = generateDemoData(new Date(2026, 9, 26));
  const base = {
    deviceId: "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f",
    timezone: "Asia/Manila",
    periods: demo.periods,
    logs: demo.dailyLogs,
    now: new Date(2026, 9, 26, 9, 0),
  };

  it("builds a valid body with the planner reminder and no health data", () => {
    const body = buildSyncBody({ ...base, profile: demo.profile, reminders: [reminder(1)] });
    expect(syncBodySchema.safeParse(body).success).toBe(true);
    expect(body.reminders[0]).toMatchObject({ kind: "once", reminderType: "planner" });
    expect(body.reminders).toHaveLength(2);
    const text = JSON.stringify(body);
    for (const word of ["label", "note", "symptom", "bleeding", "cycleDay", "phase", "period"]) {
      expect(text).not.toContain(word);
    }
  });

  it("follows discreet mode and leaves out the planner in hormonal mode", () => {
    const body = buildSyncBody({
      ...base,
      profile: makeProfile({ discreetMode: true, contraception: "hormonal" }),
      reminders: [],
    });
    expect(body).toMatchObject({ discreet: true, reminders: [] });
  });

  it("caps the list at 20 reminders", () => {
    const many = Array.from({ length: 25 }, (_, index) => reminder(index + 1));
    expect(buildSyncBody({ ...base, profile: demo.profile, reminders: many }).reminders).toHaveLength(20);
  });
});
