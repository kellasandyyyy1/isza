// Web Push on the client. Only the device ID, the push subscription, the time zone, the discreet
// flag and reminder times ever leave the device. Never labels, notes or cycle data.
import { format } from "date-fns";
import { DEVICE_ID_KEY, PUSH_LAST_SYNC_KEY, getDeviceSetting, setDeviceSetting } from "@/db/repo";
import type { DailyLog, Period, Profile, Reminder } from "@/db/schema";
import { computeCycleState, type CycleState } from "./cycle";
import { MAX_PUSH_REMINDERS, type PushReminder, type PushReminderType, type SubscribeBody, type SyncBody } from "./pushApi";

export const PUSH_PREPROMPT = "Isza only sends reminders you set. Messages never mention your cycle.";
export const PUSH_BLOCKED = "Notifications are blocked. Turn them on in your browser settings.";
export const PUSH_OFFLINE = "Notifications will sync when you are back online.";
export const IOS_PUSH_HINT = "Add Isza to your Home Screen to get notifications.";

const PLANNER_DAYS_BEFORE = 2;
const PLANNER_HOUR = 8;

const PUSH_TYPES: Record<Reminder["type"], PushReminderType> = {
  "check-in": "check-in",
  pill: "pill",
  supplement: "supplement",
  // The server only knows it as a planner reminder.
  "period-prep": "planner",
  custom: "custom",
};

// Pure helpers

// VAPID keys are base64url. PushManager.subscribe wants the raw bytes.
export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

// Enabled reminders as times and weekdays only. The label stays on the device.
export function recurringPushReminders(reminders: Reminder[]): PushReminder[] {
  return reminders
    .filter((reminder) => reminder.enabled && reminder.days.length > 0)
    .map((reminder) => ({
      kind: "recurring",
      reminderType: PUSH_TYPES[reminder.type],
      timeLocal: reminder.time,
      days: [...reminder.days].sort((a, b) => a - b),
    }));
}

// 08:00 local time, 2 days before the predicted period. None in hormonal or irregular mode,
// without a prediction, or once that time has passed. The server only sees the time.
export function plannerPushReminder(cycle: CycleState, now: Date): PushReminder | null {
  if (cycle.mode !== "standard" || !cycle.nextPeriod) return null;
  const [year, month, day] = cycle.nextPeriod.start.split("-").map(Number);
  const sendAt = new Date(year, month - 1, day - PLANNER_DAYS_BEFORE, PLANNER_HOUR, 0);
  if (sendAt <= now) return null;
  return { kind: "once", reminderType: "planner", sendAt: sendAt.toISOString() };
}

export interface SyncInput {
  deviceId: string;
  timezone: string;
  profile: Profile | null;
  reminders: Reminder[];
  periods: Period[];
  logs: DailyLog[];
  now: Date;
}

export function buildSyncBody({ deviceId, timezone, profile, reminders, periods, logs, now }: SyncInput): SyncBody {
  const cycle = computeCycleState({ periods, profile, logs, today: format(now, "yyyy-MM-dd") });
  const planner = plannerPushReminder(cycle, now);
  return {
    deviceId,
    timezone,
    discreet: profile?.discreetMode ?? false,
    reminders: [...(planner ? [planner] : []), ...recurringPushReminders(reminders)].slice(0, MAX_PUSH_REMINDERS),
  };
}

// Browser helpers

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function vapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function getDeviceId(): Promise<string> {
  const existing = await getDeviceSetting(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  await setDeviceSetting(DEVICE_ID_KEY, created);
  return created;
}

export async function getBrowserSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

function postJson(path: string, body: object): Promise<Response> {
  return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function subscribeOnServer(subscription: PushSubscription, discreet: boolean): Promise<void> {
  const keys = subscription.toJSON().keys ?? {};
  const body: SubscribeBody = {
    deviceId: await getDeviceId(),
    subscription: { endpoint: subscription.endpoint, keys: { p256dh: keys.p256dh ?? "", auth: keys.auth ?? "" } },
    timezone: localTimeZone(),
    discreet,
  };
  const response = await postJson("/api/push/subscribe", body);
  if (!response.ok) throw new Error(`Subscribe failed with ${response.status}.`);
}

export type EnableResult = "enabled" | "denied" | "unavailable" | "offline";

// Asks for permission only here, when the user turns the switch on.
export async function enablePush(discreet: boolean): Promise<EnableResult> {
  const key = vapidPublicKey();
  const registration = await navigator.serviceWorker.getRegistration();
  if (!key || !registration) return "unavailable";
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  // Forces a full sync after subscribing.
  await setDeviceSetting(PUSH_LAST_SYNC_KEY, null);
  try {
    await subscribeOnServer(subscription, discreet);
    return "enabled";
  } catch {
    return "offline";
  }
}

// Stops pushes in this browser and asks the server to delete the row. If the server cannot be
// reached, the push service reports the dead endpoint on the next send and the server removes it.
export async function disablePush(): Promise<void> {
  const subscription = await getBrowserSubscription();
  await subscription?.unsubscribe();
  await setDeviceSetting(PUSH_LAST_SYNC_KEY, null);
  const deviceId = await getDeviceSetting(DEVICE_ID_KEY);
  if (deviceId) await postJson("/api/push/unsubscribe", { deviceId }).catch(() => undefined);
}

export type SyncResult = "synced" | "unchanged" | "offline";

// Sends the reminder schedule when it differs from the last one the server accepted.
export async function syncIfChanged(body: SyncBody): Promise<SyncResult> {
  const serialized = JSON.stringify(body);
  if (serialized === (await getDeviceSetting(PUSH_LAST_SYNC_KEY))) return "unchanged";
  try {
    let response = await postJson("/api/push/sync", body);
    if (response.status === 404) {
      // The server lost this device (for example after a database reset): subscribe again.
      const subscription = await getBrowserSubscription();
      if (!subscription) return "unchanged";
      await subscribeOnServer(subscription, body.discreet);
      response = await postJson("/api/push/sync", body);
    }
    if (!response.ok) return "offline";
    await setDeviceSetting(PUSH_LAST_SYNC_KEY, serialized);
    return "synced";
  } catch {
    return "offline";
  }
}
