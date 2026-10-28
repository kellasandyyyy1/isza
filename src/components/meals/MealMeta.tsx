import { IconClock, IconCoin } from "@tabler/icons-react";
import { cx } from "@/lib/cx";
import { NUTRIENT_LABELS, formatMealPrice, type MealSuggestion } from "@/lib/meals";

// Time, the price estimate and one nutrient chip. Wraps onto a second line on narrow cards.
export function MealMeta({ suggestion, className }: { suggestion: MealSuggestion; className?: string }) {
  const { meal, highlight } = suggestion;
  return (
    <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted", className)}>
      <span className="inline-flex items-center gap-1">
        <IconClock size={16} stroke={1.75} aria-hidden />
        {meal.prepMinutes} min
      </span>
      <span className="inline-flex items-center gap-1">
        <IconCoin size={16} stroke={1.75} aria-hidden />
        {formatMealPrice(meal.estPesoPerServing)}
      </span>
      {highlight && <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-ink">{NUTRIENT_LABELS[highlight]}</span>}
    </div>
  );
}
