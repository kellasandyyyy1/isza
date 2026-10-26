"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { Icon } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: Icon;
  panel?: ReactNode;
}

type Option<T extends string> = SegmentedOption<T>;

export type SegmentedOptions<T extends string> =
  | [Option<T>, Option<T>]
  | [Option<T>, Option<T>, Option<T>]
  | [Option<T>, Option<T>, Option<T>, Option<T>];

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOptions<T>;
  value: T;
  onValueChange: (value: T) => void;
  "aria-label": string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  function handleValueChange(next: string) {
    const match = options.find((option) => option.value === next);
    if (match) onValueChange(match.value);
  }

  return (
    <Tabs.Root value={value} onValueChange={handleValueChange} className={className}>
      <Tabs.List aria-label={ariaLabel} className="flex gap-1 rounded-pill border border-line bg-surface p-1">
        {options.map(({ value: optionValue, label, icon: OptionIcon, panel }) => (
          <Tabs.Trigger
            key={optionValue}
            value={optionValue}
            // Without a panel there is nothing to control, so drop the dangling reference.
            {...(panel === undefined ? { "aria-controls": undefined } : {})}
            className={cx(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill border border-transparent px-3 text-small text-ink-muted transition-colors",
              "data-[state=active]:border-line data-[state=active]:bg-selected-bg data-[state=active]:font-semibold data-[state=active]:text-selected-ink",
            )}
          >
            {OptionIcon && <OptionIcon size={20} stroke={1.75} aria-hidden />}
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {options.map(({ value: optionValue, panel }) =>
        panel === undefined ? null : (
          <Tabs.Content key={optionValue} value={optionValue} className="mt-4">
            {panel}
          </Tabs.Content>
        ),
      )}
    </Tabs.Root>
  );
}
