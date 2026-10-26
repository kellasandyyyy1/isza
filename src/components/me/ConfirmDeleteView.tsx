"use client";

import { useState } from "react";
import { ViewHeader } from "@/components/checkin/ViewHeader";
import { Button } from "@/components/ui/Button";

interface ConfirmDeleteViewProps {
  headingId: string;
  title: string;
  // Names exactly what will be deleted.
  text: string;
  confirmLabel: string;
  backLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// A confirmation view inside the same sheet, never a second modal.
export function ConfirmDeleteView(props: ConfirmDeleteViewProps) {
  const { headingId, title, text, confirmLabel, backLabel, onConfirm, onCancel } = props;
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewHeader id={headingId} title={title} onBack={onCancel} backDisabled={deleting} backLabel={backLabel} />
      <p className="text-body text-ink">{text}</p>
      <Button fullWidth variant="danger" loading={deleting} onClick={() => void confirm()}>
        {confirmLabel}
      </Button>
      <Button fullWidth variant="ghost" disabled={deleting} onClick={onCancel}>
        Keep it
      </Button>
    </div>
  );
}
