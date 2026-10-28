"use client";

import { IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import type { DailyMeal } from "./useDailyMeal";
import { MealMeta } from "./MealMeta";

interface MealSheetProps {
  meal: DailyMeal;
  // The Food card's two lines, shown at the top: the phase sentence and today's rotating line.
  guidance: string;
  note: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCooked: () => void;
}

// The recipe for today's meal idea: ingredients, numbered steps and the note. Text only, nothing to download.
// "Show another" and "Not for me" swap the meal in place; the sheet stays open on the new one.
export function MealSheet({ meal, guidance, note, open, onOpenChange, onCooked }: MealSheetProps) {
  const [busy, setBusy] = useState<"cooked" | "another" | "not-for-me" | null>(null);
  const { suggestion } = meal;
  const tagalog = suggestion.meal.tagalogName && suggestion.meal.tagalogName !== suggestion.meal.name
    ? suggestion.meal.tagalogName
    : null;

  async function run(action: NonNullable<typeof busy>, work: () => Promise<void>) {
    setBusy(action);
    try {
      await work();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={tagalog ?? suggestion.meal.name}
      footer={
        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            icon={IconCheck}
            loading={busy === "cooked"}
            disabled={meal.cooked}
            onClick={() =>
              void run("cooked", async () => {
                await meal.markCooked();
                onCooked();
              })
            }
          >
            {meal.cooked ? "Cooked today" : "Cooked this"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              loading={busy === "another"}
              onClick={() => void run("another", meal.showAnother)}
            >
              Show another
            </Button>
            <Button variant="ghost" loading={busy === "not-for-me"} onClick={() => void run("not-for-me", meal.notForMe)}>
              Not for me
            </Button>
          </div>
        </div>
      }
    >
      <div data-meal={suggestion.meal.id} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-body text-ink">{guidance}</p>
          {note && <p className="text-small text-ink-muted">{note}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {tagalog && <p className="text-body text-ink-muted">{suggestion.meal.name}</p>}
          <MealMeta suggestion={suggestion} />
        </div>
        <section aria-labelledby="meal-ingredients" className="flex flex-col gap-2">
          <h3 id="meal-ingredients" className="text-body-strong text-ink">
            Ingredients
          </h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-ink">
            {suggestion.meal.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="meal-steps" className="flex flex-col gap-2">
          <h3 id="meal-steps" className="text-body-strong text-ink">
            Steps
          </h3>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-body text-ink">
            {suggestion.meal.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        {suggestion.meal.note && <p className="text-small text-ink-muted">{suggestion.meal.note}</p>}
      </div>
    </ResponsiveSheet>
  );
}
