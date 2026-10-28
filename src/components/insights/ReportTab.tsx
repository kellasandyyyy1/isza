"use client";

import { IconFileTypePdf } from "@tabler/icons-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import type { DailyLog, Period, Profile } from "@/db/schema";
import { buildReport, type ReportCycleCount } from "@/lib/report";
import { downloadReport } from "./report/downloadReport";

interface ReportTabProps {
  periods: Period[];
  profile: Profile | null;
  logs: DailyLog[];
  today: string;
}

export function ReportTab({ periods, profile, logs, today }: ReportTabProps) {
  const [cycleCount, setCycleCount] = useState<"3" | "6">("3");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonId = useId();
  const report = buildReport({
    periods,
    profile,
    logs,
    today,
    cycleCount: Number(cycleCount) as ReportCycleCount,
    includeNotes,
  });

  // Before one completed cycle: the button stays where it will be, disabled, with the reason it points to.
  if (!report) {
    return (
      <div className="flex h-full flex-col gap-4">
        <p className="text-body text-ink">Create a summary to bring to your doctor. It is made on this device.</p>
        <p id={reasonId} className="text-small text-ink-muted">
          Create a doctor summary once you have logged a full cycle.
        </p>
        <div className="mt-auto">
          <Button fullWidth icon={IconFileTypePdf} disabled aria-describedby={reasonId}>
            Create PDF
          </Button>
        </div>
      </div>
    );
  }

  async function create() {
    if (!report) return;
    setCreating(true);
    setError(null);
    try {
      await downloadReport(report);
    } catch {
      setError("The PDF could not be made. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-body text-ink">Create a summary to bring to your doctor. It is made on this device.</p>
      <SegmentedControl<"3" | "6">
        aria-label="Cycles in the report"
        value={cycleCount}
        onValueChange={setCycleCount}
        options={[
          { value: "3", label: "Last 3 cycles" },
          { value: "6", label: "Last 6 cycles" },
        ]}
      />
      <Switch
        label="Include my notes"
        description="Notes from your check-ins in this period."
        checked={includeNotes}
        onCheckedChange={setIncludeNotes}
      />
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <div className="mt-auto">
        <Button fullWidth icon={IconFileTypePdf} loading={creating} onClick={() => void create()}>
          Create PDF
        </Button>
      </div>
    </div>
  );
}
