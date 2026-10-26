import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useId } from "react";
import { IconButton } from "@/components/ui/IconButton";

interface CountStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

// Whole numbers from 0 up. The label names what the buttons change, for screen readers.
export function CountStepper({ label, value, onChange, min = 0 }: CountStepperProps) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex items-center justify-between gap-3">
      <span id={labelId} className="text-small text-ink-muted">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <IconButton
          icon={IconMinus}
          aria-label={`${label}: one less`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="bg-surface-2"
        />
        <output aria-live="polite" className="min-w-8 text-center text-body-strong text-ink">
          {value}
        </output>
        <IconButton icon={IconPlus} aria-label={`${label}: one more`} onClick={() => onChange(value + 1)} className="bg-surface-2" />
      </div>
    </div>
  );
}
