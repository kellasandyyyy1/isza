"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";
import { ViewHeader } from "@/components/checkin/ViewHeader";
import { Button } from "@/components/ui/Button";
import { deletePeriod } from "@/db/repo";
import type { Period } from "@/db/schema";

interface RemovePeriodConfirmProps {
  headingId: string;
  period: Period;
  onDone: () => void;
  onKeep: () => void;
}

const formatDay = (date: string) => format(parseISO(date), "MMM d");

// Names exactly what will be deleted before deleting it.
export function RemovePeriodConfirm({ headingId, period, onDone, onKeep }: RemovePeriodConfirmProps) {
  const [removing, setRemoving] = useState(false);
  const range = period.endDate
    ? `from ${formatDay(period.startDate)} to ${formatDay(period.endDate)}`
    : `that started on ${formatDay(period.startDate)}`;

  async function remove() {
    if (period.id === undefined) return;
    setRemoving(true);
    try {
      await deletePeriod(period.id);
      onDone();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewHeader id={headingId} title="Remove this period?" onBack={onKeep} backDisabled={removing} backLabel="Back to period dates" />
      <p className="text-body text-ink">This deletes the period {range}. Your check-ins are kept.</p>
      <Button fullWidth loading={removing} onClick={() => void remove()}>
        Remove period
      </Button>
      <Button fullWidth variant="ghost" disabled={removing} onClick={onKeep}>
        Keep it
      </Button>
    </div>
  );
}
