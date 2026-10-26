"use client";

import { useState, useSyncExternalStore } from "react";
import { useIosHint } from "@/components/pwa/useIosHint";
import { Switch } from "@/components/ui/Switch";
import {
  IOS_PUSH_HINT,
  PUSH_BLOCKED,
  PUSH_OFFLINE,
  PUSH_PREPROMPT,
  disablePush,
  enablePush,
  isPushSupported,
  vapidPublicKey,
} from "@/lib/push-client";
import { setPushStatus, usePushStatus } from "./pushStatus";

const subscribeNever = () => () => {};

// "Notifications on this device" at the top of Reminders. Permission is asked only when the
// user turns the switch on, never on page load.
export function PushSection({ discreet }: { discreet: boolean }) {
  const { subscribed, pending } = usePushStatus();
  const iosHint = useIosHint();
  const supported = useSyncExternalStore(subscribeNever, isPushSupported, () => false);
  const initiallyBlocked = useSyncExternalStore(
    subscribeNever,
    () => isPushSupported() && Notification.permission === "denied",
    () => false,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Not set up on this server yet: no push section at all.
  if (!vapidPublicKey()) return null;
  if (iosHint) return <p className="mb-3 rounded-input bg-surface-2 p-3 text-small text-ink">{IOS_PUSH_HINT}</p>;
  if (!supported) return null;

  async function change(on: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (!on) {
        await disablePush();
        setPushStatus({ subscribed: false, pending: false });
        return;
      }
      const result = await enablePush(discreet);
      if (result === "denied") setMessage(PUSH_BLOCKED);
      else if (result === "unavailable") setMessage("Notifications are not available right now. Try again later.");
      else setPushStatus({ subscribed: true, pending: result === "offline" });
    } finally {
      setBusy(false);
    }
  }

  const shown = message ?? (initiallyBlocked && !subscribed ? PUSH_BLOCKED : null);
  return (
    <div className="mb-3 rounded-input bg-surface-2 p-3">
      <Switch
        label="Notifications on this device"
        description={PUSH_PREPROMPT}
        checked={subscribed === true}
        disabled={busy || subscribed === null}
        onCheckedChange={(on) => void change(on)}
      />
      {shown && (
        <p role="status" className="mt-2 text-small text-ink">
          {shown}
        </p>
      )}
      {pending && subscribed && <p className="mt-2 text-small text-ink-muted">{PUSH_OFFLINE}</p>}
    </div>
  );
}
