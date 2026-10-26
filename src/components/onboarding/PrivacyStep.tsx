import { MascotSlot } from "@/components/ui/MascotSlot";
import { useId } from "react";
import type { StepProps } from "./stepProps";

export function PrivacyStep({ answers, onChange, headingId }: StepProps) {
  const checkboxId = useId();

  return (
    <div className="flex h-full flex-col justify-center">
      <MascotSlot pose="me" size="md" motion="calm" className="mb-4" />
      <h1 id={headingId} tabIndex={-1} className="text-h1 text-ink focus:outline-none">
        Your data stays with you.
      </h1>
      <p className="mt-3 text-body text-ink">Your data stays on this device. We never sell or share it.</p>
      <p className="mt-2 text-body text-ink-muted">Isza is not a medical device or a contraceptive.</p>
      <label htmlFor={checkboxId} className="mt-6 flex min-h-11 cursor-pointer items-center gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={answers.privacyAccepted}
          onChange={(event) => onChange({ privacyAccepted: event.target.checked })}
          className="size-5 shrink-0 cursor-pointer accent-ink"
        />
        <span className="text-body-strong text-ink">I understand</span>
      </label>
    </div>
  );
}
