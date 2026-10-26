"use client";

import { IconDownload } from "@tabler/icons-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { saveFile } from "@/components/ui/saveFile";
import { exportAll } from "@/db/repo";
import { backupFileName } from "@/lib/backup";

interface ExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExported: () => void;
}

export function ExportSheet({ open, onOpenChange, onExported }: ExportSheetProps) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      saveFile(blob, backupFileName(format(new Date(), "yyyy-MM-dd")));
      onExported();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Export data">
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">
          Download a copy of everything Isza keeps on this device. Store it somewhere private.
        </p>
        <Button fullWidth icon={IconDownload} loading={busy} onClick={() => void download()}>
          Download backup
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
