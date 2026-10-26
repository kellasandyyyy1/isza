import Dexie, { type EntityTable } from "dexie";
import type { DailyLog, DismissedFlag, Period, Profile, Reminder, Setting, Supply, Workout } from "./schema";

export type IszaDatabase = Dexie & {
  profile: EntityTable<Profile, "id">;
  periods: EntityTable<Period, "id">;
  dailyLogs: EntityTable<DailyLog, "date">;
  workouts: EntityTable<Workout, "id">;
  supplies: EntityTable<Supply, "id">;
  reminders: EntityTable<Reminder, "id">;
  dismissedFlags: EntityTable<DismissedFlag, "id">;
  settings: EntityTable<Setting, "key">;
};

export const db = new Dexie("isza") as IszaDatabase;

db.version(1).stores({
  profile: "id",
  periods: "++id, startDate",
  dailyLogs: "date",
  workouts: "++id, date",
  supplies: "++id, kind",
  reminders: "++id, type",
  dismissedFlags: "id",
  settings: "key",
});

export const allTables = () =>
  [db.profile, db.periods, db.dailyLogs, db.workouts, db.supplies, db.reminders, db.dismissedFlags, db.settings] as const;
