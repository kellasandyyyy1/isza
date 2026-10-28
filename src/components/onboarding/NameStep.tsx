import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { NAME_MAX_LENGTH } from "@/lib/onboarding";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

interface NameStepProps extends StepProps {
  onSkip: () => void;
}

// Optional: Next works with the field empty, and Skip clears it and moves on. Used in the Today greeting.
export function NameStep({ answers, onChange, headingId, onSkip }: NameStepProps) {
  const inputId = useId();
  return (
    <>
      <StepHeading id={headingId} title="What should we call you?" subtitle="Optional. You can change it later in Me." />
      <label htmlFor={inputId} className="mb-1.5 block text-small text-ink-muted">
        Your name
      </label>
      <input
        id={inputId}
        type="text"
        maxLength={NAME_MAX_LENGTH}
        autoComplete="given-name"
        enterKeyHint="next"
        value={answers.name}
        onChange={(event) => onChange({ name: event.target.value })}
        className="h-12 w-full rounded-input bg-surface-2 px-4 text-body text-ink"
      />
      <div className="mt-3 flex justify-center">
        <Button variant="secondary" size="sm" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </>
  );
}
