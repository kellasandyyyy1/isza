// @vitest-environment node
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { ReminderRow } from "./push-db";
import { sendDueReminders, type SendDeps } from "./push-send";

// Never send real pushes or touch a real database in tests.
vi.mock("web-push", () => ({ setVapidDetails: vi.fn(), sendNotification: vi.fn(), WebPushError: class extends Error {} }));
vi.mock("./supabase", () => ({ supabaseAdmin: vi.fn(() => { throw new Error("No database in tests."); }) }));
// The real module checks VAPID keys on load; these tests inject their own send function.
vi.mock("./web-push", () => ({ sendPush: vi.fn() }));

const subscription = (timezone: string, discreet = false) => ({
  endpoint: "https://push.example/abc",
  p256dh: "key",
  auth: "auth",
  timezone,
  discreet,
});

const row = (id: string, fields: Partial<ReminderRow>): ReminderRow => ({
  id,
  device_id: "device-1",
  kind: "recurring",
  reminder_type: "check-in",
  time_local: "08:00",
  days: [0, 1, 2, 3, 4, 5, 6],
  send_at: null,
  last_sent_at: null,
  push_subscriptions: subscription("Asia/Manila"),
  ...fields,
});

// 08:02 in Manila.
const NOW = new Date("2026-10-26T00:02:00Z");

type MockDeps = { [K in keyof SendDeps]: Mock<SendDeps[K]> };

function deps(rows: ReminderRow[], results: Record<string, "sent" | "gone" | "failed"> = {}): MockDeps {
  return {
    loadReminderRows: vi.fn<SendDeps["loadReminderRows"]>(async () => rows),
    sendPush: vi.fn<SendDeps["sendPush"]>(async (_subscription, payload) => results[payload.tag] ?? "sent"),
    markSent: vi.fn<SendDeps["markSent"]>(async () => undefined),
    deleteSubscription: vi.fn<SendDeps["deleteSubscription"]>(async () => undefined),
    deleteReminders: vi.fn<SendDeps["deleteReminders"]>(async () => undefined),
  };
}

describe("sendDueReminders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends due reminders with fixed text and marks them sent", async () => {
    const d = deps([row("a", {}), row("b", { time_local: "12:00" })]);
    expect(await sendDueReminders(NOW, d)).toEqual({ sent: 1, failed: 0, removed: 0 });
    expect(d.sendPush).toHaveBeenCalledTimes(1);
    expect(d.sendPush.mock.calls[0][1]).toEqual({
      title: "Isza",
      body: "Time for your daily check-in.",
      url: "/today?checkin=1",
      tag: "check-in",
    });
    expect(d.markSent).toHaveBeenCalledWith(["a"], NOW);
  });

  it("uses the discreet text when the device asks for it", async () => {
    const d = deps([row("a", { reminder_type: "planner", push_subscriptions: subscription("Asia/Manila", true) })]);
    await sendDueReminders(NOW, d);
    expect(d.sendPush.mock.calls[0][1]).toEqual({ title: "Reminder", body: "You have a new reminder.", url: "/today", tag: "planner" });
  });

  it("deletes a subscription the push service says is gone, and skips its other reminders", async () => {
    const d = deps(
      [row("a", { reminder_type: "pill" }), row("b", { reminder_type: "supplement" })],
      { pill: "gone" },
    );
    expect(await sendDueReminders(NOW, d)).toEqual({ sent: 0, failed: 0, removed: 1 });
    expect(d.deleteSubscription).toHaveBeenCalledWith("device-1");
    expect(d.sendPush).toHaveBeenCalledTimes(1);
  });

  it("counts failures without marking them sent", async () => {
    const d = deps([row("a", {})], { "check-in": "failed" });
    expect(await sendDueReminders(NOW, d)).toEqual({ sent: 0, failed: 1, removed: 0 });
    expect(d.markSent).toHaveBeenCalledWith([], NOW);
  });

  it("sends once reminders and removes those sent over a week ago", async () => {
    const d = deps([
      row("due", { kind: "once", reminder_type: "planner", time_local: null, days: null, send_at: "2026-10-26T00:00:00Z" }),
      row("old", {
        kind: "once",
        reminder_type: "planner",
        time_local: null,
        days: null,
        send_at: "2026-10-01T00:00:00Z",
        last_sent_at: "2026-10-01T00:01:00Z",
      }),
    ]);
    expect(await sendDueReminders(NOW, d)).toEqual({ sent: 1, failed: 0, removed: 0 });
    expect(d.deleteReminders).toHaveBeenCalledWith(["old"]);
  });
});
