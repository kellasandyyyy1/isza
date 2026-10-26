"use client";

import { useId, useState } from "react";
import { LastPeriodCalendar } from "@/components/onboarding/LastPeriodCalendar";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { addPeriod } from "@/db/repo";
import { periodFromStart } from "@/lib/onboarding";

interface LogPeriodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  today: string;
  typicalPeriodLength: number | null;
}

export function LogPeriodSheet({ open, onOpenChange, today, typicalPeriodLength }: LogPeriodSheetProps) {
  const labelId = useId();
  const [date, setDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!date) return;
    setSaving(true);
    try {
      await addPeriod(periodFromStart(date, today, typicalPeriodLength));
      onOpenChange(false);
      setDate(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="When did your last period start?"
      description="Tap the first day of bleeding."
      footer={
        <Button fullWidth disabled={!date} loading={saving} onClick={() => void save()}>
          Save period
        </Button>
      }
    >
      <p id={labelId} className="sr-only">
        Period start date
      </p>
      <LastPeriodCalendar value={date} onChange={setDate} today={today} labelledBy={labelId} />
    </ResponsiveSheet>
  );
}
