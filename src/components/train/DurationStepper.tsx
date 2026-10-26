import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useId } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { DURATION_RANGE, stepDuration } from "@/lib/training";

// Label on the left, stepper on the right, in one row.
export function DurationStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex items-center justify-between gap-3">
      <span id={labelId} className="text-small text-ink-muted">
        Duration
      </span>
      <div className="flex items-center gap-2">
        <IconButton
          icon={IconMinus}
          aria-label="5 minutes less"
          disabled={value <= DURATION_RANGE.min}
          onClick={() => onChange(stepDuration(value, -1))}
          className="bg-surface-2"
        />
        <output aria-live="polite" className="min-w-20 text-center text-body-strong text-ink">
          {value} min
        </output>
        <IconButton
          icon={IconPlus}
          aria-label="5 minutes more"
          disabled={value >= DURATION_RANGE.max}
          onClick={() => onChange(stepDuration(value, 1))}
          className="bg-surface-2"
        />
      </div>
    </div>
  );
}
