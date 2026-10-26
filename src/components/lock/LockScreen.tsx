"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { DeleteAllForm } from "@/components/me/DeleteAllForm";
import { Button } from "@/components/ui/Button";
import { MascotSlot } from "@/components/ui/MascotSlot";
import type { AppLock } from "@/db/repo";
import { cx } from "@/lib/cx";
import { verifyPin } from "@/lib/pin";

export const PIN_HONEST_LINE = "The PIN hides the app from others. It does not encrypt your data.";

interface LockScreenProps {
  lock: AppLock;
  onUnlock: () => void;
}

// Covers the whole app. "Forgot PIN" offers only deleting all data.
export function LockScreen({ lock, onUnlock }: LockScreenProps) {
  const router = useRouter();
  const ids = { heading: useId(), input: useId(), error: useId() };
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  async function change(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setError(null);
    if (digits.length < 4) return;
    if (await verifyPin(digits, lock)) {
      onUnlock();
    } else {
      setPin("");
      setError("That PIN did not match. Try again.");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ids.heading}
      className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-bg px-6 py-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <MascotSlot pose="me" size="md" motion="calm" />
        {forgot ? (
          <>
            <h1 id={ids.heading} className="text-h1 text-ink">
              Forgot your PIN?
            </h1>
            <p className="text-body text-ink-muted">The only way back in is to delete all data on this device.</p>
            <div className="w-full text-left">
              <DeleteAllForm
                onDeleted={() => {
                  onUnlock();
                  router.replace("/onboarding");
                }}
              />
            </div>
            <Button variant="ghost" onClick={() => setForgot(false)}>
              Back to PIN
            </Button>
          </>
        ) : (
          <>
            <h1 id={ids.heading} className="text-h1 text-ink">
              Enter your PIN
            </h1>
            <label htmlFor={ids.input} className="sr-only">
              PIN
            </label>
            <input
              id={ids.input}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(event) => void change(event.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error ? ids.error : undefined}
              className="peer sr-only"
            />
            {/* Shows how many digits are in; tapping it focuses the field. */}
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => document.getElementById(ids.input)?.focus()}
              className="flex gap-3 rounded-pill px-4 py-3 peer-focus-visible:outline-2 peer-focus-visible:outline-primary"
            >
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cx("size-3.5 rounded-pill border-2 border-ink", index < pin.length && "bg-ink")}
                />
              ))}
            </button>
            <p id={ids.error} role={error ? "alert" : undefined} className="min-h-5 text-small text-danger">
              {error}
            </p>
            <p className="text-small text-ink-muted">{PIN_HONEST_LINE}</p>
            <Button variant="ghost" onClick={() => setForgot(true)}>
              Forgot PIN
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
