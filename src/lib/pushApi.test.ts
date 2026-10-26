import { describe, expect, it } from "vitest";
import { MAX_PUSH_REMINDERS, deviceBodySchema, subscribeBodySchema, syncBodySchema } from "./pushApi";

const deviceId = "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f";
const subscribe = {
  deviceId,
  subscription: { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BPk", auth: "xyz" } },
  timezone: "Asia/Manila",
  discreet: false,
};
const recurring = { kind: "recurring", reminderType: "check-in", timeLocal: "20:30", days: [1, 2, 3] } as const;
const once = { kind: "once", reminderType: "planner", sendAt: "2026-11-11T00:00:00.000Z" } as const;
const sync = { deviceId, timezone: "Europe/London", discreet: true, reminders: [recurring, once] };

describe("push request bodies", () => {
  it("accept valid bodies", () => {
    expect(subscribeBodySchema.safeParse(subscribe).success).toBe(true);
    expect(syncBodySchema.safeParse(sync).success).toBe(true);
    expect(deviceBodySchema.safeParse({ deviceId }).success).toBe(true);
  });

  it("reject extra fields such as a label or a note, at every level", () => {
    expect(syncBodySchema.safeParse({ ...sync, reminders: [{ ...recurring, label: "Pill" }] }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, reminders: [{ ...once, note: "Period soon" }] }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, cycleDay: 12 }).success).toBe(false);
    expect(subscribeBodySchema.safeParse({ ...subscribe, name: "Mia" }).success).toBe(false);
    expect(
      subscribeBodySchema.safeParse({ ...subscribe, subscription: { ...subscribe.subscription, expirationTime: null } })
        .success,
    ).toBe(false);
    expect(deviceBodySchema.safeParse({ deviceId, label: "x" }).success).toBe(false);
  });

  it("reject bad values", () => {
    expect(syncBodySchema.safeParse({ ...sync, deviceId: "not-a-uuid" }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, timezone: "Mars/Olympus" }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, reminders: [{ ...recurring, timeLocal: "24:00" }] }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, reminders: [{ ...recurring, days: [7] }] }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, reminders: [{ ...recurring, reminderType: "period" }] }).success).toBe(false);
    expect(syncBodySchema.safeParse({ ...sync, reminders: [{ kind: "once", reminderType: "planner" }] }).success).toBe(false);
    expect(
      subscribeBodySchema.safeParse({ ...subscribe, subscription: { ...subscribe.subscription, endpoint: "http://x.y" } })
        .success,
    ).toBe(false);
  });

  it("allow at most 20 reminders", () => {
    const many = Array.from({ length: MAX_PUSH_REMINDERS + 1 }, () => recurring);
    expect(syncBodySchema.safeParse({ ...sync, reminders: many.slice(0, MAX_PUSH_REMINDERS) }).success).toBe(true);
    expect(syncBodySchema.safeParse({ ...sync, reminders: many }).success).toBe(false);
  });
});
