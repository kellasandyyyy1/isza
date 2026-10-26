"use client";

import { IconAlertTriangle, IconUpload } from "@tabler/icons-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { importAll } from "@/db/repo";
import { parseBackup, type BackupCheck } from "@/lib/backup";

interface ImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type Checked = Extract<BackupCheck, { ok: true }>;

// The file is validated first. Nothing changes until the user confirms the replacement.
export function ImportSheet({ open, onOpenChange, onImported }: ImportSheetProps) {
  const inputId = useId();
  const [checked, setChecked] = useState<Checked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    setChecked(null);
    setError(null);
    if (!file) return;
    const result = parseBackup(await file.text());
    if (result.ok) setChecked(result);
    else setError(result.error);
  }

  async function replace() {
    if (!checked) return;
    setBusy(true);
    try {
      await importAll(checked.data);
      setChecked(null);
      onImported();
    } catch {
      setError("The backup could not be imported. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  }

  const counts = checked?.counts;
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setChecked(null);
          setError(null);
        }
        onOpenChange(next);
      }}
      title="Import data"
    >
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Restore a backup file made with Export data.</p>
        <label
          htmlFor={inputId}
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-pill bg-surface-2 text-body-strong text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
        >
          <IconUpload size={20} stroke={1.75} aria-hidden />
          Choose backup file
          <input
            id={inputId}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => void pick(event.target.files?.[0])}
          />
        </label>
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        {counts && (
          <>
            <p className="text-body text-ink">
              This backup has {counts.periods} periods, {counts.checkIns} check-ins, {counts.workouts} workouts,{" "}
              {counts.supplies} supplies and {counts.reminders} reminders.
            </p>
            <p role="alert" className="flex items-start gap-2 text-body-strong text-ink">
              <IconAlertTriangle size={20} stroke={1.75} aria-hidden className="mt-0.5 shrink-0 text-warning" />
              This replaces everything on this device.
            </p>
            <Button fullWidth variant="danger" loading={busy} onClick={() => void replace()}>
              Replace my data
            </Button>
          </>
        )}
      </div>
    </ResponsiveSheet>
  );
}
