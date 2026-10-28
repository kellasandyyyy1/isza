"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  getAppLock,
  getLog,
  getMealSettings,
  getProfile,
  getValidationSettings,
  getWaterLog,
  getWaterSettings,
  listMealHistory,
  listWaterLogs,
  listDismissedFlags,
  listLogs,
  listPeriods,
  listReminders,
  listSupplies,
  listWorkouts,
  type AppLock,
  type MealSettings,
} from "./repo";
import type { ValidationSettings } from "@/lib/validation";
import type { WaterSettings } from "@/lib/water";
import type {
  DailyLog,
  DismissedFlag,
  MealHistoryEntry,
  Period,
  Profile,
  Reminder,
  Supply,
  WaterLog,
  Workout,
} from "./schema";

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

export function useValidationSettings(): ValidationSettings | undefined {
  return useLiveQuery(getValidationSettings, []);
}

export function useMealSettings(): MealSettings | undefined {
  return useLiveQuery(getMealSettings, []);
}

export function useWaterSettings(): WaterSettings | undefined {
  return useLiveQuery(getWaterSettings, []);
}

export function useWaterLog(date: string): WaterLog | null | undefined {
  return useLiveQuery(() => getWaterLog(date), [date]);
}

export function useWaterLogs(from: string, to: string): WaterLog[] | undefined {
  return useLiveQuery(() => listWaterLogs(from, to), [from, to]);
}

// Settings and history in one query, so a swap that changes both is never seen half done.
export function useMealData(
  from: string,
  to: string,
): { settings: MealSettings; history: MealHistoryEntry[] } | undefined {
  return useLiveQuery(
    async () => ({ settings: await getMealSettings(), history: await listMealHistory(from, to) }),
    [from, to],
  );
}
