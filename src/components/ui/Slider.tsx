"use client";

import * as RadixSlider from "@radix-ui/react-slider";
import { useId } from "react";

export interface SliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  // Small words under the two ends of the track, such as "Easy" and "Max".
  captions?: { min: string; max: string };
}

export function Slider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue = String,
  disabled,
  captions,
}: SliderProps) {
  const labelId = useId();
  const valueText = formatValue(value);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className="text-body-strong text-ink">
          {label}
        </span>
        <span aria-hidden className="text-body text-ink-muted">
          {valueText}
        </span>
      </div>
      <RadixSlider.Root
        value={[value]}
        onValueChange={(values) => onValueChange(values[0] ?? value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="relative flex h-11 w-full touch-none items-center select-none data-[disabled]:opacity-50"
      >
        <RadixSlider.Track className="relative h-2 grow overflow-hidden rounded-pill bg-surface-2">
          <RadixSlider.Range className="absolute h-full bg-ink" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-labelledby={labelId}
          aria-valuetext={valueText}
          className="relative block size-7 rounded-pill border-2 border-ink bg-surface shadow-raised after:absolute after:-inset-2.5"
        />
      </RadixSlider.Root>
      {captions && (
        <div aria-hidden className="-mt-1 flex justify-between text-caption text-ink-muted">
          <span>{captions.min}</span>
          <span>{captions.max}</span>
        </div>
      )}
    </div>
  );
}
