"use client";

import { useState } from "react";
import { useAppLockControls } from "@/components/lock/AppLockProvider";
import { PIN_HONEST_LINE } from "@/components/lock/LockScreen";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { clearAppLock, setAppLock, type AppLock } from "@/db/repo";
import { hashPin, isValidPin, verifyPin } from "@/lib/pin";
import { PinField } from "./PinField";

interface AppLockSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lock: AppLock | null;
  onChanged: (message: string) => void;
}

// Off: set a PIN twice. On: the current PIN turns it off. To change a PIN, turn it off and on again.
export function AppLockSheet({ open, onOpenChange, lock, onChanged }: AppLockSheetProps) {
  const { markUnlocked } = useAppLockControls();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setPin("");
    setConfirm("");
    setError(null);
  }

  async function turnOn() {
    if (pin !== confirm) {
      setError("The two PINs do not match.");
      return;
    }
    setBusy(true);
    try {
      // This visit stays unlocked; the lock starts next time the app opens.
      markUnlocked();
      await setAppLock(await hashPin(pin));
      reset();
      onChanged("App lock is on");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    if (!lock) return;
    setBusy(true);
    try {
      if (!(await verifyPin(pin, lock))) {
        setError("That PIN did not match.");
        setPin("");
        return;
      }
      await clearAppLock();
      reset();
      onChanged("App lock is off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="App lock"
      description={PIN_HONEST_LINE}
    >
      <div className="flex flex-col gap-3">
        {lock ? (
          <>
            <p className="text-body text-ink">App lock is on. Enter your PIN to turn it off.</p>
            <PinField label="Current PIN" value={pin} onChange={setPin} />
          </>
        ) : (
          <>
            <p className="text-body text-ink">Set a 4-digit PIN. You will need it each time you open Isza.</p>
            <PinField label="New PIN" value={pin} onChange={setPin} />
            <PinField label="Repeat the PIN" value={confirm} onChange={setConfirm} />
          </>
        )}
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        {lock ? (
          <Button fullWidth disabled={!isValidPin(pin)} loading={busy} onClick={() => void turnOff()}>
            Turn off app lock
          </Button>
        ) : (
          <Button fullWidth disabled={!isValidPin(pin) || !isValidPin(confirm)} loading={busy} onClick={() => void turnOn()}>
            Turn on app lock
          </Button>
        )}
      </div>
    </ResponsiveSheet>
  );
}
