import Dexie, { type EntityTable } from "dexie";
import type {
  DailyLog,
  DismissedFlag,
  MealHistoryEntry,
  Period,
  Profile,
  Reminder,
  Setting,
  Supply,
  WaterLog,
  Workout,
} from "./schema";

export type IszaDatabase = Dexie & {
  profile: EntityTable<Profile, "id">;
  periods: EntityTable<Period, "id">;
  dailyLogs: EntityTable<DailyLog, "date">;
  workouts: EntityTable<Workout, "id">;
  supplies: EntityTable<Supply, "id">;
  reminders: EntityTable<Reminder, "id">;
  dismissedFlags: EntityTable<DismissedFlag, "id">;
  settings: EntityTable<Setting, "key">;
  mealHistory: EntityTable<MealHistoryEntry, "id">;
  waterLogs: EntityTable<WaterLog, "date">;
};

// "isza" is the legacy name, from before the app was called Iszacycle. It stays for data continuity: renaming it
// would open a new, empty database and leave every user's data behind. Nothing user-facing shows it.
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

// Daily meal ideas: one row per action, several a day, looked up by date.
db.version(2).stores({
  mealHistory: "++id, date",
});

// The optional water tally, one row per day. Adding a table needs no data change: every other table and
// every row in them carries over as it is.
db.version(3).stores({
  waterLogs: "date",
});

// Every table with her data: "Delete all data" and an import clear all of them.
export const allTables = () =>
  [
    db.profile,
    db.periods,
    db.dailyLogs,
    db.workouts,
    db.supplies,
    db.reminders,
    db.dismissedFlags,
    db.settings,
    db.mealHistory,
    db.waterLogs,
  ] as const;
