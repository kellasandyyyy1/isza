"use client";

import { format, parseISO } from "date-fns";
import { useId, useState } from "react";
import { ViewHeader } from "@/components/checkin/ViewHeader";
import { Button } from "@/components/ui/Button";
import { addPeriod, updatePeriod } from "@/db/repo";
import type { Period } from "@/db/schema";
import { periodEditError } from "@/lib/calendar";
import { cx } from "@/lib/cx";
import { periodFromStart } from "@/lib/onboarding";

interface PeriodEditorProps {
  headingId: string;
  date: string;
  today: string;
  // The logged period around this date, if any.
  period: Period | null;
  periods: Period[];
  typicalPeriodLength: number | null;
  onBack: () => void;
  onRemove: () => void;
}

const fieldClasses =
  "h-12 w-full rounded-input border-2 border-transparent bg-surface-2 px-4 text-body text-ink aria-[invalid=true]:border-danger";

export function PeriodEditor(props: PeriodEditorProps) {
  const { headingId, date, today, period, periods, typicalPeriodLength, onBack, onRemove } = props;
  const ids = { start: useId(), end: useId(), error: useId() };
  const [startDate, setStartDate] = useState(period?.startDate ?? date);
  const [endDate, setEndDate] = useState(period?.endDate ?? "");
  const [saving, setSaving] = useState(false);

  // A new period from this day ends after the usual length, like everywhere else.
  const newPeriod = periodFromStart(date, today, typicalPeriodLength);
  const error = period
    ? startDate === ""
      ? "Pick a start date."
      : periodEditError(periods, period.id ?? null, startDate, endDate === "" ? null : endDate, today)
    : periodEditError(periods, null, newPeriod.startDate, newPeriod.endDate, today);

  async function save() {
    setSaving(true);
    try {
      if (period?.id !== undefined) {
        await updatePeriod(period.id, { startDate, endDate: endDate === "" ? null : endDate });
      } else {
        await addPeriod(newPeriod);
      }
      onBack();
    } finally {
      setSaving(false);
    }
  }

  if (!period) {
    return (
      <div className="flex flex-col gap-3">
        <ViewHeader id={headingId} title="Period dates" onBack={onBack} backLabel="Back to day" />
        <p className="text-body text-ink">No period is logged on {format(parseISO(date), "EEE, MMM d")}.</p>
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        <Button fullWidth disabled={error !== null} loading={saving} onClick={() => void save()}>
          Mark as period start
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewHeader id={headingId} title="Period dates" onBack={onBack} backLabel="Back to day" />
      <div>
        <label htmlFor={ids.start} className="mb-1.5 block text-small text-ink-muted">
          Start date
        </label>
        <input
          id={ids.start}
          type="date"
          max={today}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? ids.error : undefined}
          className={fieldClasses}
        />
      </div>
      <div>
        <label htmlFor={ids.end} className="mb-1.5 block text-small text-ink-muted">
          End date (leave empty if it has not ended)
        </label>
        <input
          id={ids.end}
          type="date"
          max={today}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? ids.error : undefined}
          className={fieldClasses}
        />
      </div>
      <p id={ids.error} role={error ? "alert" : undefined} className={cx("text-small", error ? "text-danger" : "sr-only")}>
        {error}
      </p>
      <Button fullWidth disabled={error !== null} loading={saving} onClick={() => void save()}>
        Save dates
      </Button>
      <Button fullWidth variant="ghost" disabled={saving} onClick={onRemove}>
        Remove period
      </Button>
    </div>
  );
}
