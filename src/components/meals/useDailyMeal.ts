"use client";

import { useEffect, useRef } from "react";
import { MEALS } from "@/content/meals";
import { addMealHistory, swapMeal, type MealSettings } from "@/db/repo";
import { useMealData } from "@/db/hooks";
import type { MealHistoryEntry } from "@/db/schema";
import { shiftDate, type CycleState } from "@/lib/cycle";
import { getAlternatives, getDailyMeal, type MealInput, type MealSuggestion } from "@/lib/meals";

// How far back repeats are avoided.
const RECENT_DAYS = 21;

export interface DailyMeal {
  suggestion: MealSuggestion;
  cooked: boolean;
  markCooked: () => Promise<void>;
  showAnother: () => Promise<void>;
  notForMe: () => Promise<void>;
}

// The meal each past day ended on: its last row that was not a skip. Newest day first.
function recentMealIds(history: MealHistoryEntry[], today: string): string[] {
  const byDate = new Map<string, string>();
  for (const row of history) if (row.date < today && row.action !== "skipped") byDate.set(row.date, row.mealId);
  return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([, mealId]) => mealId);
}

function fitsSettings(mealId: string, settings: MealSettings): boolean {
  const meal = MEALS.find((item) => item.id === mealId);
  return (
    meal !== undefined &&
    meal.costTier <= settings.maxCostTier &&
    !settings.excludedMealIds.includes(meal.id) &&
    (settings.cuisinePreference === "mixed" || meal.cuisine === settings.cuisinePreference)
  );
}

// A meal already logged today, with the same highlight rule as a fresh pick.
function suggestionFor(mealId: string, input: MealInput): MealSuggestion | null {
  const meal = MEALS.find((item) => item.id === mealId);
  return meal ? getDailyMeal({ ...input, meals: [meal] }) : null;
}

// Today's meal idea. Undefined while loading (including while the caller's own data loads, passed as null),
// null when meal ideas are off. The first time a day's meal is worked out it is logged as shown, so a reload
// keeps it.
export function useDailyMeal(cycle: CycleState | null, day: string | null): DailyMeal | null | undefined {
  // Placeholders keep the hooks in order while the caller loads; nothing is used until both are set.
  const today = day ?? "2000-01-01";
  const cycleState = cycle;
  const data = useMealData(shiftDate(today, -RECENT_DAYS), today);
  const settings = data?.settings;
  const history = data?.history;
  const logged = useRef<string | null>(null);

  const ready = settings !== undefined && history !== undefined && cycleState !== null && day !== null;
  const todayRows = ready ? history.filter((row) => row.date === today) : [];
  const skippedToday = todayRows.filter((row) => row.action === "skipped").map((row) => row.mealId);
  // The day's last row is its meal, unless that row is a skip: then a new one is picked.
  const last = todayRows.at(-1) ?? null;
  const latest = last && last.action !== "skipped" ? last : null;
  // Today's logged meal holds until the preferences change under it: then a fitting one is picked.
  const current = latest && settings && fitsSettings(latest.mealId, settings) ? latest : null;
  const input: MealInput | null = ready
    ? {
        cycleState,
        today,
        recentMealIds: recentMealIds(history, today),
        maxCostTier: settings.maxCostTier,
        excludedIds: [...settings.excludedMealIds, ...skippedToday],
        cuisinePreference: settings.cuisinePreference,
      }
    : null;
  const suggestion = input === null ? null : current ? suggestionFor(current.mealId, input) : getDailyMeal(input);
  const enabled = settings?.mealSuggestionsEnabled ?? false;

  // Log today's pick once, the first time it shows.
  const pickId = suggestion?.meal.id ?? null;
  const needsLog = ready && enabled && current === null && pickId !== null;
  useEffect(() => {
    if (!needsLog || pickId === null || logged.current === `${today}:${pickId}`) return;
    logged.current = `${today}:${pickId}`;
    void addMealHistory({ date: today, mealId: pickId, action: "shown" });
  }, [needsLog, pickId, today]);

  if (!ready) return undefined;
  if (!enabled || !suggestion || !input) return null;

  async function replace(nextSettings?: MealSettings) {
    if (!suggestion || !input) return;
    const [next] = getAlternatives({ ...input, excludedIds: [...input.excludedIds, suggestion.meal.id] }, 1);
    await swapMeal(today, suggestion.meal.id, next?.meal.id ?? null, nextSettings);
  }

  return {
    suggestion,
    cooked: current?.action === "cooked",
    markCooked: async () => {
      await addMealHistory({ date: today, mealId: suggestion.meal.id, action: "cooked" });
    },
    showAnother: () => replace(),
    notForMe: () => replace({ ...settings, excludedMealIds: [...new Set([...settings.excludedMealIds, suggestion.meal.id])] }),
  };
}
