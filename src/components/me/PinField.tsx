import { useId } from "react";

interface PinFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// Digits only, at most 4.
export function PinField({ label, value, onChange }: PinFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-small text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
        className="h-12 w-full rounded-input bg-surface-2 px-4 text-body tracking-widest text-ink"
      />
    </div>
  );
}
