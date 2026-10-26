"use client";

import { IconTrash } from "@tabler/icons-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { setPushStatus } from "@/components/push/pushStatus";
import { deleteAll } from "@/db/repo";
import { disablePush, isPushSupported } from "@/lib/push-client";

const CONFIRM_WORD = "DELETE";

// Used from the Me page and from "Forgot PIN". Names exactly what is deleted.
export function DeleteAllForm({ onDeleted }: { onDeleted: () => void }) {
  const ids = { input: useId(), help: useId() };
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    try {
      // Push first, while the device ID is still known: stop pushes here and remove the server row.
      if (isPushSupported()) await disablePush().catch(() => undefined);
      setPushStatus({ subscribed: false, pending: false });
      await deleteAll();
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p id={ids.help} className="text-body text-ink">
        This deletes your profile, periods, check-ins, workouts, supplies, reminders, settings and app lock from this
        device. It cannot be undone.
      </p>
      <div>
        <label htmlFor={ids.input} className="mb-1.5 block text-small text-ink-muted">
          Type {CONFIRM_WORD} to confirm
        </label>
        <input
          id={ids.input}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          aria-describedby={ids.help}
          className="h-12 w-full rounded-input bg-surface-2 px-4 text-body text-ink"
        />
      </div>
      <Button
        fullWidth
        variant="danger"
        icon={IconTrash}
        disabled={typed !== CONFIRM_WORD}
        loading={deleting}
        onClick={() => void remove()}
      >
        Delete all data
      </Button>
    </div>
  );
}
