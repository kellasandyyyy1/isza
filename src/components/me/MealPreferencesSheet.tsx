"use client";

import { IconX } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MEALS, type CostTier } from "@/content/meals";
import { saveMealSettings, type MealSettings } from "@/db/repo";
import type { CuisinePreference } from "@/lib/meals";

const BUDGET = { 1: "tight", 2: "normal", 3: "flexible" } as const;
type Budget = (typeof BUDGET)[CostTier];
const TIER: Record<Budget, CostTier> = { tight: 1, normal: 2, flexible: 3 };

interface MealPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MealSettings;
}

// Budget, style and the meals she passed on with "Not for me". Changes save as she taps.
export function MealPreferencesSheet({ open, onOpenChange, settings }: MealPreferencesSheetProps) {
  const save = (patch: Partial<MealSettings>) => void saveMealSettings({ ...settings, ...patch });
  const excluded = settings.excludedMealIds
    .map((id) => MEALS.find((meal) => meal.id === id))
    .filter((meal) => meal !== undefined);

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Meal preferences">
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-body-strong text-ink">Budget</h3>
          <SegmentedControl<Budget>
            aria-label="Budget"
            value={BUDGET[settings.maxCostTier]}
            onValueChange={(budget) => save({ maxCostTier: TIER[budget] })}
            options={[
              { value: "tight", label: "Tight" },
              { value: "normal", label: "Normal" },
              { value: "flexible", label: "Flexible" },
            ]}
          />
          <p className="text-small text-ink-muted">Prices are rough estimates and vary by market.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-body-strong text-ink">Style</h3>
          <SegmentedControl<CuisinePreference>
            aria-label="Style"
            value={settings.cuisinePreference}
            onValueChange={(cuisinePreference) => save({ cuisinePreference })}
            options={[
              { value: "mixed", label: "Mixed" },
              { value: "filipino", label: "Filipino" },
              { value: "simple", label: "Simple" },
            ]}
          />
        </section>

        <section aria-labelledby="not-for-me-heading" className="flex flex-col gap-2">
          <h3 id="not-for-me-heading" className="text-body-strong text-ink">
            Not for me
          </h3>
          {excluded.length === 0 ? (
            <p className="text-small text-ink-muted">Meals you skip with Not for me show up here.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {excluded.map((meal) => (
                <li key={meal.id} className="flex min-h-12 items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-body text-ink">{meal.tagalogName ?? meal.name}</span>
                  <IconButton
                    icon={IconX}
                    aria-label={`Bring back ${meal.tagalogName ?? meal.name}`}
                    onClick={() => save({ excludedMealIds: settings.excludedMealIds.filter((id) => id !== meal.id) })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ResponsiveSheet>
  );
}
