import { cx } from "@/lib/cx";
import { SELECTED_CLASSES, UNSELECTED_CLASSES } from "@/components/ui/selection";

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioCardGroupProps<T extends string> {
  name: string;
  labelledBy: string;
  options: RadioCardOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

// Native radios, so arrow keys and screen readers work as expected.
// The dot inside the circle shows the choice, so color is not the only signal.
export function RadioCardGroup<T extends string>({ name, labelledBy, options, value, onChange }: RadioCardGroupProps<T>) {
  return (
    <fieldset aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cx(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-input px-4 py-3 transition-colors",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
              checked ? SELECTED_CLASSES : UNSELECTED_CLASSES,
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cx(
                "flex size-5 shrink-0 items-center justify-center rounded-pill border-2",
                checked ? "border-ink" : "border-ink-muted",
              )}
            >
              {checked && <span className="size-2.5 rounded-pill bg-ink" />}
            </span>
            <span>
              <span className="block text-body-strong text-ink">{option.label}</span>
              {option.description && <span className="block text-small text-ink-muted">{option.description}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
