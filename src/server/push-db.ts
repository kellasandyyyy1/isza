import "server-only";
import { z } from "zod";
import { PUSH_REMINDER_TYPES, type PushReminder, type SubscribeBody } from "@/lib/pushApi";
import { supabaseAdmin } from "./supabase";

// All database access for push. Rows are checked with zod as they come back.

const subscriptionRowSchema = z.object({
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  timezone: z.string(),
  discreet: z.boolean(),
});
export type SubscriptionRow = z.infer<typeof subscriptionRowSchema>;

const reminderRowSchema = z.object({
  id: z.string(),
  device_id: z.string(),
  kind: z.enum(["recurring", "once"]),
  reminder_type: z.enum(PUSH_REMINDER_TYPES),
  time_local: z.string().nullable(),
  days: z.array(z.number()).nullable(),
  send_at: z.string().nullable(),
  last_sent_at: z.string().nullable(),
  push_subscriptions: subscriptionRowSchema,
});
export type ReminderRow = z.infer<typeof reminderRowSchema>;

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function upsertSubscription({ deviceId, subscription, timezone, discreet }: SubscribeBody): Promise<void> {
  const db = supabaseAdmin();
  // An endpoint belongs to one device. A browser that got a new device ID (after deleting its data)
  // takes its endpoint with it.
  check(await db.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint).neq("device_id", deviceId));
  check(
    await db.from("push_subscriptions").upsert(
      {
        device_id: deviceId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        timezone,
        discreet,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id" },
    ),
  );
}

// False when the device is not subscribed.
export async function replaceReminders(
  deviceId: string,
  timezone: string,
  discreet: boolean,
  reminders: PushReminder[],
): Promise<boolean> {
  const db = supabaseAdmin();
  const updated = check(
    await db
      .from("push_subscriptions")
      .update({ timezone, discreet, updated_at: new Date().toISOString() })
      .eq("device_id", deviceId)
      .select("device_id"),
  );
  if (!updated || updated.length === 0) return false;
  const rows = reminders.map((reminder) =>
    reminder.kind === "recurring"
      ? { kind: "recurring", reminder_type: reminder.reminderType, time_local: reminder.timeLocal, days: reminder.days }
      : { kind: "once", reminder_type: reminder.reminderType, send_at: reminder.sendAt },
  );
  // One SQL statement, so the replacement is all or nothing.
  check(await db.rpc("replace_push_reminders", { p_device_id: deviceId, p_reminders: rows }));
  return true;
}

export async function deleteSubscription(deviceId: string): Promise<void> {
  check(await supabaseAdmin().from("push_subscriptions").delete().eq("device_id", deviceId));
}

export async function getSubscription(deviceId: string): Promise<SubscriptionRow | null> {
  const data = check(
    await supabaseAdmin()
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, timezone, discreet")
      .eq("device_id", deviceId)
      .maybeSingle(),
  );
  return data ? subscriptionRowSchema.parse(data) : null;
}

export async function loadReminderRows(): Promise<ReminderRow[]> {
  const data = check(
    await supabaseAdmin()
      .from("push_reminders")
      .select(
        "id, device_id, kind, reminder_type, time_local, days, send_at, last_sent_at, push_subscriptions!inner(endpoint, p256dh, auth, timezone, discreet)",
      ),
  );
  return z.array(reminderRowSchema).parse(data ?? []);
}

export async function markSent(ids: string[], at: Date): Promise<void> {
  if (ids.length === 0) return;
  check(await supabaseAdmin().from("push_reminders").update({ last_sent_at: at.toISOString() }).in("id", ids));
}

export async function deleteReminders(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  check(await supabaseAdmin().from("push_reminders").delete().in("id", ids));
}
