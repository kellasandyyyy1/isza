import "server-only";
import { isDue, isExpiredOnce } from "@/lib/pushSchedule";
import * as pushDb from "./push-db";
import { pushMessage, pushUrl } from "./push-messages";
import { sendPush } from "./web-push";

export interface SendCounts {
  sent: number;
  failed: number;
  removed: number;
}

// Injected so the logic can be tested without a database or real pushes.
export interface SendDeps {
  loadReminderRows: typeof pushDb.loadReminderRows;
  sendPush: typeof sendPush;
  markSent: typeof pushDb.markSent;
  deleteSubscription: typeof pushDb.deleteSubscription;
  deleteReminders: typeof pushDb.deleteReminders;
}

const defaultDeps: SendDeps = { ...pushDb, sendPush };

// Sends every due reminder, removes subscriptions the push service says are gone,
// and clears once reminders sent more than a week ago.
export async function sendDueReminders(now: Date, deps: SendDeps = defaultDeps): Promise<SendCounts> {
  const rows = await deps.loadReminderRows();
  const counts: SendCounts = { sent: 0, failed: 0, removed: 0 };
  const sentIds: string[] = [];
  const goneDevices = new Set<string>();

  for (const row of rows) {
    if (goneDevices.has(row.device_id)) continue;
    const subscription = row.push_subscriptions;
    const scheduled = {
      kind: row.kind,
      timeLocal: row.time_local,
      days: row.days,
      sendAt: row.send_at,
      lastSentAt: row.last_sent_at,
    };
    if (!isDue(scheduled, subscription.timezone, now)) continue;

    const message = pushMessage(row.reminder_type, subscription.discreet);
    const result = await deps.sendPush(subscription, { ...message, url: pushUrl(row.reminder_type), tag: row.reminder_type });
    if (result === "sent") {
      counts.sent += 1;
      sentIds.push(row.id);
    } else if (result === "gone") {
      await deps.deleteSubscription(row.device_id);
      goneDevices.add(row.device_id);
      counts.removed += 1;
    } else {
      counts.failed += 1;
    }
  }

  await deps.markSent(sentIds, now);
  const expired = rows.filter(
    (row) =>
      !goneDevices.has(row.device_id) &&
      isExpiredOnce({ kind: row.kind, timeLocal: null, days: null, sendAt: row.send_at, lastSentAt: row.last_sent_at }, now),
  );
  await deps.deleteReminders(expired.map((row) => row.id));
  return counts;
}
