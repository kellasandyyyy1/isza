"use client";

import * as RadixSwitch from "@radix-ui/react-switch";
import { useId } from "react";

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

// The thumb position shows the state too, so color is not the only signal.
export function Switch({ label, description, checked, onCheckedChange, disabled }: SwitchProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-body-strong text-ink">
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-small text-ink-muted">
            {description}
          </p>
        )}
      </div>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        className="relative inline-flex h-8 w-13 shrink-0 items-center rounded-pill bg-ink-muted p-1 transition-colors after:absolute after:-inset-1.5 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary"
      >
        <RadixSwitch.Thumb className="block size-6 rounded-pill bg-surface shadow-raised transition-transform data-[state=checked]:translate-x-5" />
      </RadixSwitch.Root>
    </div>
  );
}
