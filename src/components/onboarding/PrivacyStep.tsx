import { useId } from "react";
import { ArtIcon } from "@/components/ui/ArtIcon";
import { cx } from "@/lib/cx";
import type { StepProps } from "./stepProps";

// The last screen: the privacy promise, a small fun fact about the app, and one tap to agree.
export function PrivacyStep({ answers, onChange, headingId }: StepProps) {
  const checkboxId = useId();

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <h1 id={headingId} tabIndex={-1} className="mb-1 text-h1 text-ink focus:outline-none">
        Your data stays with you.
      </h1>

      <section className="flex gap-3 rounded-card bg-surface-2 p-4">
        <ArtIcon name="security" className="self-start" />
        <div className="flex flex-col gap-1">
          <p className="text-small text-ink">Your data stays on this device. We never sell or share it.</p>
          <p className="text-small text-ink-muted">Iszacycle is not a medical device or a contraceptive.</p>
        </div>
      </section>

      <section aria-labelledby={`${checkboxId}-fact`} className="flex gap-3 rounded-card bg-primary-tint p-4">
        <ArtIcon name="heart" className="self-start" />
        <div className="flex flex-col gap-1">
          <h2 id={`${checkboxId}-fact`} className="text-body-strong text-ink">
            A little fun fact
          </h2>
          <p className="text-small text-ink">
            Iszacycle is named after my girlfriend. I made it for her, so tracking feels easy and stress feels lighter.
          </p>
          <p className="text-small text-ink">The mascot is based on her, in her favorite black gym outfit.</p>
          <p className="text-small text-ink">It is also for every woman who wants to understand her body better.</p>
        </div>
      </section>

      {/* The whole row is the tap target. A check in the box shows the state, not color alone. */}
      <label
        htmlFor={checkboxId}
        className={cx(
          "mt-1 flex min-h-14 cursor-pointer items-center gap-3 rounded-input border border-line px-4",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
          answers.privacyAccepted && "bg-selected-bg",
        )}
      >
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
