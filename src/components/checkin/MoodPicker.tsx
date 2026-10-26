import { useId } from "react";
import type { Mood } from "@/db/schema";
import { cx } from "@/lib/cx";
import { SELECTED_CLASSES, UNSELECTED_CLASSES } from "@/components/ui/selection";
import { MOOD_OPTIONS } from "./checkinConfig";
import { GroupLabel } from "./GroupLabel";

// Tapping the selected mood again clears it.
export function MoodPicker({ value, onChange }: { value: Mood | null; onChange: (value: Mood | null) => void }) {
  const labelId = useId();
  return (
    <div>
      <GroupLabel id={labelId}>Mood</GroupLabel>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-5 gap-2">
        {MOOD_OPTIONS.map(({ value: mood, label, icon: MoodIcon }) => (
          <button
            key={mood}
            type="button"
            aria-pressed={value === mood}
            onClick={() => onChange(value === mood ? null : mood)}
            className={cx(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-input py-1.5 text-caption transition-colors",
              value === mood ? SELECTED_CLASSES : UNSELECTED_CLASSES,
            )}
          >
            <MoodIcon size={24} stroke={1.75} aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
