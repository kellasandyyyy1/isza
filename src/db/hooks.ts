"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  getAppLock,
  getLog,
  getProfile,
  listDismissedFlags,
  listLogs,
  listPeriods,
  listReminders,
  listSupplies,
  listWorkouts,
  type AppLock,
} from "./repo";
import type { DailyLog, DismissedFlag, Period, Profile, Reminder, Supply, Workout } from "./schema";

// Every hook returns undefined while loading. Single records return null when missing.

export function useProfile(): Profile | null | undefined {
  return useLiveQuery(getProfile, []);
}

export function usePeriods(): Period[] | undefined {
  return useLiveQuery(listPeriods, []);
}

export function useLog(date: string): DailyLog | null | undefined {
  return useLiveQuery(() => getLog(date), [date]);
}

export function useLogs(from: string, to: string): DailyLog[] | undefined {
  return useLiveQuery(() => listLogs(from, to), [from, to]);
}

export function useWorkouts(from: string, to: string): Workout[] | undefined {
  return useLiveQuery(() => listWorkouts(from, to), [from, to]);
}

export function useSupplies(): Supply[] | undefined {
  return useLiveQuery(listSupplies, []);
}

export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(listReminders, []);
}

export function useDismissedFlags(): DismissedFlag[] | undefined {
  return useLiveQuery(listDismissedFlags, []);
}

// The stored PIN hash, or null when app lock is off.
export function useAppLock(): AppLock | null | undefined {
  return useLiveQuery(getAppLock, []);
}
