import { addDays, format } from "date-fns";
import { z } from "zod";
import type { PeriodChange } from "@/lib/checkin";
import { allTables, db } from "./db";
import {
  EXPORT_VERSION,
  dailyLogSchema,
  dismissedFlagSchema,
  exportDataSchema,
  isoDateSchema,
  periodSchema,
  profileSchema,
  reminderSchema,
  supplySchema,
  timestampSchema,
  workoutSchema,
  type DailyLog,
  type DismissedFlag,
  type ExportData,
  type Period,
  type Profile,
  type Reminder,
  type Supply,
  type Workout,
} from "./schema";

export class DataValidationError extends Error {
  constructor(what: string, details: string) {
    super(`Invalid ${what}:\n${details}`);
    this.name = "DataValidationError";
  }
}

export class RecordNotFoundError extends Error {
  constructor(what: string, id: number | string) {
    super(`No ${what} found with id ${id}.`);
    this.name = "RecordNotFoundError";
  }
}

function validate<T extends z.ZodType>(schema: T, value: unknown, what: string): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new DataValidationError(what, z.prettifyError(result.error));
  return result.data;
}

const nowTimestamp = () => new Date().toISOString();

// Auto-increment tables always return a key on add. Dexie types it as optional.
function requireId(id: number | undefined, what: string): number {
  if (id === undefined) throw new Error(`Saving the ${what} did not return an id.`);
  return id;
}

// Fields that cannot be changed through update functions.
type Changes<T> = Partial<Omit<T, "id">>;

// Profile

export async function getProfile(): Promise<Profile | null> {
  return (await db.profile.get("me")) ?? null;
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const valid = validate(profileSchema, profile, "profile");
  await db.profile.put(valid);
  return valid;
}

// Saves the onboarding profile and the optional first period together, or neither.
export async function completeOnboarding(profile: Profile, period: Omit<Period, "id"> | null): Promise<void> {
  const validProfile = validate(profileSchema, profile, "profile");
  const validPeriod = period === null ? null : validate(periodSchema, period, "period");
  await db.transaction("rw", db.profile, db.periods, async () => {
    await db.profile.put(validProfile);
    if (validPeriod) await db.periods.add(validPeriod);
  });
}

// Periods

export async function listPeriods(): Promise<Period[]> {
  return db.periods.orderBy("startDate").toArray();
}

export async function addPeriod(period: Omit<Period, "id">): Promise<number> {
  const valid = validate(periodSchema, period, "period");
  return requireId(await db.periods.add(valid), "period");
}

export async function updatePeriod(id: number, changes: Changes<Period>): Promise<Period> {
  const existing = await db.periods.get(id);
  if (!existing) throw new RecordNotFoundError("period", id);
  const valid = validate(periodSchema, { ...existing, ...changes, id }, "period");
  await db.periods.put(valid);
  return valid;
}

export async function deletePeriod(id: number): Promise<void> {
  await db.periods.delete(id);
}

// Daily logs

export type DailyLogPatch = Pick<DailyLog, "date"> & Partial<Omit<DailyLog, "date" | "updatedAt">>;

function emptyLog(date: string): Omit<DailyLog, "updatedAt"> {
  return {
    date,
    bleeding: "none",
    energy: null,
    mood: null,
    symptoms: [],
    sleepHours: null,
    bbt: null,
    lhTest: null,
    note: null,
  };
}

export async function getLog(date: string): Promise<DailyLog | null> {
  return (await db.dailyLogs.get(date)) ?? null;
}

// Merges the given fields into the log for that date, creating it if needed.
export async function upsertLog(patch: DailyLogPatch): Promise<DailyLog> {
  const date = validate(isoDateSchema, patch.date, "log date");
  return db.transaction("rw", db.dailyLogs, async () => {
    const base = (await db.dailyLogs.get(date)) ?? emptyLog(date);
    const valid = validate(dailyLogSchema, { ...base, ...patch, date, updatedAt: nowTimestamp() }, "daily log");
    await db.dailyLogs.put(valid);
    return valid;
  });
}

// Inclusive on both ends.
export async function listLogs(from: string, to: string): Promise<DailyLog[]> {
  return db.dailyLogs.where("date").between(from, to, true, true).toArray();
}

// Saves a check-in and its period change together, or neither.
export async function saveCheckIn(patch: DailyLogPatch, change: PeriodChange): Promise<DailyLog> {
  return db.transaction("rw", db.dailyLogs, db.periods, async () => {
    const log = await upsertLog(patch);
    switch (change.type) {
      case "start":
        await addPeriod({ startDate: change.startDate, endDate: null });
        break;
      case "end":
        await updatePeriod(change.periodId, { endDate: change.endDate });
        break;
      case "reopen":
        await updatePeriod(change.periodId, { endDate: null });
        break;
      case "remove":
        await deletePeriod(change.periodId);
        break;
    }
    return log;
  });
}

// Workouts

export async function addWorkout(workout: Omit<Workout, "id">): Promise<number> {
  const valid = validate(workoutSchema, workout, "workout");
  return requireId(await db.workouts.add(valid), "workout");
}

// Inclusive on both ends, sorted by date.
export async function listWorkouts(from: string, to: string): Promise<Workout[]> {
  return db.workouts.where("date").between(from, to, true, true).sortBy("date");
}

export async function deleteWorkout(id: number): Promise<void> {
  await db.workouts.delete(id);
}

// Supplies

export async function listSupplies(): Promise<Supply[]> {
  return db.supplies.toArray();
}

export async function getSupply(id: number): Promise<Supply | null> {
  return (await db.supplies.get(id)) ?? null;
}

export async function addSupply(supply: Omit<Supply, "id">): Promise<number> {
  const valid = validate(supplySchema, supply, "supply");
  return requireId(await db.supplies.add(valid), "supply");
}

export async function updateSupply(id: number, changes: Changes<Supply>): Promise<Supply> {
  const existing = await db.supplies.get(id);
  if (!existing) throw new RecordNotFoundError("supply", id);
  const valid = validate(supplySchema, { ...existing, ...changes, id }, "supply");
  await db.supplies.put(valid);
  return valid;
}

export async function deleteSupply(id: number): Promise<void> {
  await db.supplies.delete(id);
}

// Reminders

export async function listReminders(): Promise<Reminder[]> {
  return db.reminders.toArray();
}

export async function getReminder(id: number): Promise<Reminder | null> {
  return (await db.reminders.get(id)) ?? null;
}

export async function addReminder(reminder: Omit<Reminder, "id">): Promise<number> {
  const valid = validate(reminderSchema, reminder, "reminder");
  return requireId(await db.reminders.add(valid), "reminder");
}

export async function updateReminder(id: number, changes: Changes<Reminder>): Promise<Reminder> {
  const existing = await db.reminders.get(id);
  if (!existing) throw new RecordNotFoundError("reminder", id);
  const valid = validate(reminderSchema, { ...existing, ...changes, id }, "reminder");
  await db.reminders.put(valid);
  return valid;
}

export async function deleteReminder(id: number): Promise<void> {
  await db.reminders.delete(id);
}

// Dismissed flags

export async function listDismissedFlags(): Promise<DismissedFlag[]> {
  return db.dismissedFlags.toArray();
}

// Hides a flag until `days` days after today.
export async function dismissFlag(id: string, days: number, today: Date = new Date()): Promise<DismissedFlag> {
  const valid = validate(
    dismissedFlagSchema,
    { id, until: format(addDays(today, days), "yyyy-MM-dd") },
    "dismissed flag",
  );
  await db.dismissedFlags.put(valid);
  return valid;
}

// App lock. Only the salted hash is stored, as two settings.

const APP_LOCK_SALT_KEY = "app-lock-salt";
const APP_LOCK_HASH_KEY = "app-lock-hash";
const appLockSchema = z.object({
  salt: z.string().regex(/^[0-9a-f]{32}$/),
  hash: z.string().regex(/^[0-9a-f]{64}$/),
});
export type AppLock = z.infer<typeof appLockSchema>;

export async function getAppLock(): Promise<AppLock | null> {
  const [salt, hash] = await db.settings.bulkGet([APP_LOCK_SALT_KEY, APP_LOCK_HASH_KEY]);
  const parsed = appLockSchema.safeParse({ salt: salt?.value, hash: hash?.value });
  return parsed.success ? parsed.data : null;
}

export async function setAppLock(lock: AppLock): Promise<void> {
  const valid = validate(appLockSchema, lock, "app lock");
  await db.settings.bulkPut([
    { key: APP_LOCK_SALT_KEY, value: valid.salt },
    { key: APP_LOCK_HASH_KEY, value: valid.hash },
  ]);
}

export async function clearAppLock(): Promise<void> {
  await db.settings.bulkDelete([APP_LOCK_SALT_KEY, APP_LOCK_HASH_KEY]);
}

// In-app reminders: the last time due reminders were shown, so each one shows once.

const REMINDERS_CHECKED_KEY = "reminders-checked-at";

export async function getRemindersCheckedAt(): Promise<Date | null> {
  const setting = await db.settings.get(REMINDERS_CHECKED_KEY);
  const parsed = timestampSchema.safeParse(setting?.value);
  return parsed.success ? new Date(parsed.data) : null;
}

export async function setRemindersCheckedAt(at: Date): Promise<void> {
  const value = validate(timestampSchema, at.toISOString(), "reminder check time");
  await db.settings.put({ key: REMINDERS_CHECKED_KEY, value });
}

// Web Push device settings. They belong to this browser, not to the person's data:
// they are left out of backups and survive an import, so a backup restored on a second
// device never shares (and overwrites) the first device's push subscription.

export const DEVICE_ID_KEY = "deviceId";
export const PUSH_LAST_SYNC_KEY = "push-last-sync";
const DEVICE_SETTING_KEYS = [DEVICE_ID_KEY, PUSH_LAST_SYNC_KEY];

export async function getDeviceSetting(key: typeof DEVICE_ID_KEY | typeof PUSH_LAST_SYNC_KEY): Promise<string | null> {
  const value = (await db.settings.get(key))?.value;
  return typeof value === "string" ? value : null;
}

export async function setDeviceSetting(key: typeof DEVICE_ID_KEY | typeof PUSH_LAST_SYNC_KEY, value: string | null) {
  if (value === null) await db.settings.delete(key);
  else await db.settings.put({ key, value });
}

// Export, import, delete

export async function exportAll(): Promise<ExportData> {
  return db.transaction("r", allTables(), async () => {
    const data = {
      version: EXPORT_VERSION,
      profile: (await db.profile.get("me")) ?? null,
      periods: await db.periods.orderBy("id").toArray(),
      dailyLogs: await db.dailyLogs.orderBy("date").toArray(),
      workouts: await db.workouts.orderBy("id").toArray(),
      supplies: await db.supplies.orderBy("id").toArray(),
      reminders: await db.reminders.orderBy("id").toArray(),
      dismissedFlags: await db.dismissedFlags.orderBy("id").toArray(),
      settings: (await db.settings.orderBy("key").toArray()).filter((s) => !DEVICE_SETTING_KEYS.includes(s.key)),
    };
    return validate(exportDataSchema, data, "export");
  });
}

// Validates everything first, then replaces all data in one transaction.
// This device's push settings are kept.
export async function importAll(json: unknown): Promise<void> {
  const data = validate(exportDataSchema, json, "import file");
  await db.transaction("rw", allTables(), async () => {
    const deviceSettings = await db.settings.bulkGet(DEVICE_SETTING_KEYS);
    await Promise.all(allTables().map((table) => table.clear()));
    await db.settings.bulkPut(deviceSettings.filter((setting) => setting !== undefined));
    if (data.profile) await db.profile.put(data.profile);
    await db.periods.bulkPut(data.periods);
    await db.dailyLogs.bulkPut(data.dailyLogs);
    await db.workouts.bulkPut(data.workouts);
    await db.supplies.bulkPut(data.supplies);
    await db.reminders.bulkPut(data.reminders);
    await db.dismissedFlags.bulkPut(data.dismissedFlags);
    await db.settings.bulkPut(data.settings.filter((setting) => !DEVICE_SETTING_KEYS.includes(setting.key)));
  });
}

export async function deleteAll(): Promise<void> {
  await db.transaction("rw", allTables(), async () => {
    await Promise.all(allTables().map((table) => table.clear()));
  });
}
