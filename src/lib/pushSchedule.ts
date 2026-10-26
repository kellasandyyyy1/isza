// When a server-side reminder is due. Pure, so the timezone logic is easy to test.
// Uses Intl.DateTimeFormat only, no date library.

export const DUE_WINDOW_MINUTES = 5;
export const ONCE_RETENTION_DAYS = 7;
const MINUTE_MS = 60 * 1000;
const WEEKDAY_NUMBERS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export interface LocalParts {
  // "yyyy-MM-dd" in the time zone.
  date: string;
  // 0 is Sunday.
  weekday: number;
  // Minutes since local midnight.
  minutes: number;
}

export function localParts(at: Date, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAY_NUMBERS[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export interface ScheduledReminder {
  kind: "recurring" | "once";
  timeLocal: string | null;
  days: number[] | null;
  sendAt: string | null;
  lastSentAt: string | null;
}

// Recurring: today's weekday is chosen, the time is in (now - 5 minutes, now] local time,
// and it was not already sent on that local day. Once: send_at has passed and it was never sent.
export function isDue(reminder: ScheduledReminder, timeZone: string, now: Date): boolean {
  if (reminder.kind === "once") {
    return reminder.sendAt !== null && new Date(reminder.sendAt) <= now && reminder.lastSentAt === null;
  }
  if (!reminder.timeLocal || !reminder.days) return false;
  const [hours, minutes] = reminder.timeLocal.split(":").map(Number);
  const target = hours * 60 + minutes;
  // The whole minutes in the window are now, now - 1, ... now - 4. Each is checked in local time,
  // so a window that crosses local midnight uses the right day.
  for (let back = 0; back < DUE_WINDOW_MINUTES; back++) {
    const local = localParts(new Date(now.getTime() - back * MINUTE_MS), timeZone);
    if (local.minutes !== target || !reminder.days.includes(local.weekday)) continue;
    const sentToday = reminder.lastSentAt !== null && localParts(new Date(reminder.lastSentAt), timeZone).date === local.date;
    return !sentToday;
  }
  return false;
}

// Once reminders are removed a week after they were sent.
export function isExpiredOnce(reminder: ScheduledReminder, now: Date): boolean {
  if (reminder.kind !== "once" || reminder.lastSentAt === null) return false;
  return now.getTime() - new Date(reminder.lastSentAt).getTime() > ONCE_RETENTION_DAYS * 24 * 60 * MINUTE_MS;
}
