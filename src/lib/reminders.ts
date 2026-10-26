import { z } from "zod";
import { reminderSchema, type Reminder } from "@/db/schema";

export type ReminderType = Reminder["type"];

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  pill: "Pill",
  supplement: "Supplement",
  "period-prep": "Period prep",
  "check-in": "Check-in",
  custom: "Custom",
};

// Monday first, as on the calendar. Values follow the stored format: 0 is Sunday.
export const WEEKDAYS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
] as const;

// The add and edit form: at least one day is needed.
export const reminderFormSchema = reminderSchema.omit({ id: true }).extend({
  days: reminderSchema.shape.days.pipe(z.array(z.number()).min(1, "Pick at least one day.")),
});

const NORMAL_TEXT: Record<Exclude<ReminderType, "custom">, string> = {
  pill: "Time to take your pill",
  supplement: "Time for your supplement",
  "period-prep": "Your period may start soon. Pack what you need.",
  "check-in": "Time for your check-in",
};

// Discreet mode never mentions periods, symptoms or contraception. A custom label could, so it is hidden too.
const DISCREET_TEXT: Record<ReminderType, string> = {
  pill: "Time for your daily reminder",
  supplement: "Time for your supplement",
  "period-prep": "Time to check your plans",
  "check-in": "Time for your check-in",
  custom: "You have a reminder",
};

// The text a reminder shows when it fires.
export function reminderText(reminder: Pick<Reminder, "type" | "label">, discreet: boolean): string {
  if (discreet) return DISCREET_TEXT[reminder.type];
  return reminder.type === "custom" ? reminder.label : NORMAL_TEXT[reminder.type];
}

export const DUE_WINDOW_HOURS = 12;

export interface DueReminder {
  reminder: Reminder;
  at: Date;
}

// Times a reminder was due after `since` (at most 12 hours ago) and up to `now`, oldest first.
// Only enabled reminders count, and only on their chosen weekdays.
export function dueReminders(reminders: Reminder[], now: Date, since: Date | null): DueReminder[] {
  const windowStart = new Date(now.getTime() - DUE_WINDOW_HOURS * 60 * 60 * 1000);
  const from = since && since > windowStart ? since : windowStart;
  const due: DueReminder[] = [];
  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    const [hours, minutes] = reminder.time.split(":").map(Number);
    // Today's and yesterday's times are the only ones that can fall in a 12-hour window.
    for (const daysBack of [1, 0]) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack, hours, minutes);
      if (at > from && at <= now && reminder.days.includes(at.getDay())) due.push({ reminder, at });
    }
  }
  return due.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// The period-prep card on Today, 2 days before the predicted period.
export function periodPrepText(discreet: boolean): string {
  return discreet ? "Plan ahead: check your supplies." : "Period likely in 2 days. Pack your supplies.";
}

export function daysSummary(days: number[]): string {
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((day) => set.has(day))) return "Weekdays";
  if (set.size === 2 && set.has(0) && set.has(6)) return "Weekends";
  if (set.size === 0) return "No days";
  return WEEKDAYS.filter((day) => set.has(day.value))
    .map((day) => day.short)
    .join(", ");
}
