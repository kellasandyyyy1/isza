import { IconMinus, IconPlus } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import { cx } from "@/lib/cx";

interface LengthStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled: boolean;
  labelledBy: string;
}

export function LengthStepper({ value, min, max, onChange, disabled, labelledBy }: LengthStepperProps) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex items-center justify-center gap-6">
      <IconButton
        icon={IconMinus}
        aria-label="One day fewer"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className="bg-surface-2"
      />
      <output aria-live="polite" className={cx("min-w-28 text-center", disabled && "opacity-40")}>
        <span className="block text-display text-ink">{value}</span>
        <span className="block text-small text-ink-muted">days</span>
      </output>
      <IconButton
        icon={IconPlus}
        aria-label="One day more"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className="bg-surface-2"
      />
    </div>
  );
}
