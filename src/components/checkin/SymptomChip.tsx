import { SYMPTOM_LEVEL_NAMES, type SymptomLevel } from "@/lib/checkin";
import { cx } from "@/lib/cx";
import { SELECTED_CLASSES, UNSELECTED_CLASSES } from "@/components/ui/selection";

interface SymptomChipProps {
  label: string;
  level: SymptomLevel;
  onTap: () => void;
  // Names the level beside the dots while the symptom is on, for the symptom shortcut.
  showLevel?: boolean;
}

// 1 to 3 filled dots show the level; the border shows the symptom is on. The name says it too.
export function SymptomChip({ label, level, onTap, showLevel = false }: SymptomChipProps) {
  return (
    <button
      type="button"
      aria-label={`${label}, ${SYMPTOM_LEVEL_NAMES[level]}`}
      onClick={onTap}
      className={cx(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-input px-1 py-1.5 text-center text-caption leading-tight transition-colors",
        level > 0 ? SELECTED_CLASSES : UNSELECTED_CLASSES,
      )}
    >
      <span>{label}</span>
      <span aria-hidden className="flex items-center gap-1">
        {[1, 2, 3].map((dot) => (
          <span key={dot} className={cx("size-1.5 rounded-pill", dot <= level ? "bg-ink" : "bg-line")} />
        ))}
        {showLevel && level > 0 && (
          <span className="ml-0.5 font-semibold capitalize">{SYMPTOM_LEVEL_NAMES[level]}</span>
        )}
      </span>
    </button>
  );
}
