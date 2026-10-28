// Water: a tally that is always on, and optional reminders. No daily target, no streaks, nothing to fall short of.
// Pure functions only, with no "@/" imports, so the service worker can bundle this file too.

export type WaterInterval = 2 | 3 | 4;

export interface WaterSettings {
  waterRemindersEnabled: boolean;
  // "HH:mm", local time.
  waterWindowStart: string;
  waterWindowEnd: string;
  waterIntervalHours: WaterInterval;
  waterGlassMl: number;
}

export const DEFAULT_WATER_SETTINGS: WaterSettings = {
  waterRemindersEnabled: false,
  waterWindowStart: "08:00",
  waterWindowEnd: "20:00",
  waterIntervalHours: 3,
  waterGlassMl: 250,
};

export const WATER_INTERVALS: WaterInterval[] = [2, 3, 4];
export const MAX_WATER_REMINDERS = 5;
// A glass logged this recently quiets the next reminder.
export const WATER_QUIET_MINUTES = 60;

// The text of an in-app water reminder. The push text is fixed on the server, the same words.
export const WATER_REMINDER_TEXT = "Time for a glass of water.";
export const WATER_REMINDER_DISCREET_TEXT = "You have a reminder";

export interface WaterLogLike {
  count: number;
  // ISO timestamp of the last change.
  updatedAt: string;
}

// One tap up or down. Never below 0.
export function nextWaterCount(count: number, delta: 1 | -1): number {
  return Math.max(0, count + delta);
}

// "4 glasses today", or a neutral line at 0. Never a target or a share of one.
export function waterCountText(count: number): string {
  if (count === 0) return "No glasses logged yet";
  return count === 1 ? "1 glass today" : `${count} glasses today`;
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Reminder times from the start of the window, every interval, up to the end. At most 5 a day.
// 08:00 to 20:00 every 3 hours: 08:00, 11:00, 14:00, 17:00, 20:00.
export function waterReminderTimes(start: string, end: string, intervalHours: WaterInterval): string[] {
  const from = toMinutes(start);
  const to = toMinutes(end);
  const times: string[] = [];
  for (let at = from; at <= to && times.length < MAX_WATER_REMINDERS; at += intervalHours * 60) times.push(toTime(at));
  return times;
}

// Water reminders sync only while their switch is on.
export function waterRemindersActive(settings: WaterSettings): boolean {
  return settings.waterRemindersEnabled;
}

// The recurring push reminders for water, every day of the week. Times only: nothing else leaves the device.
export function waterPushReminders(
  settings: WaterSettings,
): { kind: "recurring"; reminderType: "water"; timeLocal: string; days: number[] }[] {
  if (!waterRemindersActive(settings)) return [];
  return waterReminderTimes(settings.waterWindowStart, settings.waterWindowEnd, settings.waterIntervalHours).map(
    (timeLocal) => ({ kind: "recurring", reminderType: "water", timeLocal, days: [0, 1, 2, 3, 4, 5, 6] }),
  );
}

// True when a glass was logged in the last hour, so the reminder stays quiet.
export function shouldSuppressWaterReminder(log: WaterLogLike | null | undefined, now: Date): boolean {
  if (!log || log.count <= 0) return false;
  const since = now.getTime() - new Date(log.updatedAt).getTime();
  return since >= 0 && since < WATER_QUIET_MINUTES * 60 * 1000;
}

// The latest water reminder time that came due after `since` and up to `now`, today only. For the in-app
// reminder when the app opens; at most one, however many were missed.
export function latestDueWaterReminder(settings: WaterSettings, now: Date, since: Date | null): Date | null {
  if (!waterRemindersActive(settings)) return null;
  let latest: Date | null = null;
  for (const time of waterReminderTimes(settings.waterWindowStart, settings.waterWindowEnd, settings.waterIntervalHours)) {
    const [hours, minutes] = time.split(":").map(Number);
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (at <= now && (since === null || at > since)) latest = at;
  }
  return latest;
}

// "yyyy-MM-dd" in local time, without date-fns, for the service worker.
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Days needed before the Patterns tab says anything about water.
export const WATER_INSIGHT_MIN_DAYS = 14;

// One plain line about how often she logs water, from 14 logged days. Nothing about amounts, and no link to
// mood, energy or symptoms. "Most days" from half of the days since the first log.
export function waterInsightLine(loggedDates: string[], today: string): string | null {
  const days = [...new Set(loggedDates)].filter((date) => date <= today).sort();
  if (days.length < WATER_INSIGHT_MIN_DAYS) return null;
  const span = Math.round((Date.parse(`${today}T00:00:00`) - Date.parse(`${days[0]}T00:00:00`)) / 86_400_000) + 1;
  return days.length / span >= 0.5 ? "You log water on most days" : "You log water some days";
}
