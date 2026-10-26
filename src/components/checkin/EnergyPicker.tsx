import { useId } from "react";
import type { Energy } from "@/db/schema";
import { cx } from "@/lib/cx";
import { SELECTED_CLASSES, UNSELECTED_CLASSES } from "@/components/ui/selection";
import { GroupLabel } from "./GroupLabel";

const LEVELS: Energy[] = [1, 2, 3, 4, 5];

// Tapping the selected level again clears it. Selected levels are filled and bold, not only colored.
export function EnergyPicker({ value, onChange }: { value: Energy | null; onChange: (value: Energy | null) => void }) {
  const labelId = useId();
  return (
    <div>
      <GroupLabel id={labelId}>Energy</GroupLabel>
      <div role="group" aria-labelledby={labelId} className="flex items-center gap-2">
        <span aria-hidden className="text-caption text-ink-muted">
          Low
        </span>
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={value === level}
            aria-label={`${level}${level === 1 ? ", low" : level === 5 ? ", high" : ""}`}
            onClick={() => onChange(value === level ? null : level)}
            className={cx(
              "flex h-11 flex-1 items-center justify-center rounded-input text-body transition-colors",
              value === level ? SELECTED_CLASSES : UNSELECTED_CLASSES,
            )}
          >
            {level}
          </button>
        ))}
        <span aria-hidden className="text-caption text-ink-muted">
          High
        </span>
      </div>
    </div>
  );
}
