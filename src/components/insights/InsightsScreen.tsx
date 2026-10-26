"use client";

import { format } from "date-fns";
import { useState } from "react";
import { CheckInSheet } from "@/components/checkin/CheckInSheet";
import { LogPeriodSheet } from "@/components/today/LogPeriodSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toast } from "@/components/ui/Toast";
import { useDismissedFlags, useLogs, usePeriods, useProfile, useWorkouts } from "@/db/hooks";
import { completedCycles } from "@/lib/cycle";
import { cycleSummary, recentCycles } from "@/lib/cycleHistory";
import { computeInsights } from "@/lib/insights";
import { buildTodayView } from "@/lib/today";
import { CyclesTab } from "./CyclesTab";
import { PatternsTab } from "./PatternsTab";
import { ReportTab } from "./ReportTab";

const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

type Tab = "patterns" | "cycles" | "report";

export function InsightsScreen() {
  const profile = useProfile();
  const periods = usePeriods();
  const logs = useLogs(ALL_DATES.from, ALL_DATES.to);
  const workouts = useWorkouts(ALL_DATES.from, ALL_DATES.to);
  const dismissedFlags = useDismissedFlags();
  const [tab, setTab] = useState<Tab>("patterns");
  const [sheet, setSheet] = useState<"check-in" | "log-period" | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  if (
    profile === undefined ||
    periods === undefined ||
    logs === undefined ||
    workouts === undefined ||
    dismissedFlags === undefined
  ) {
    return <div aria-busy="true" className="flex-1" />;
  }

  // Data only loads in the browser, so the clock is never read during prerendering.
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const { flags } = buildTodayView({ profile, periods, logs, dismissedFlags, now });
  const logPeriod = () => setSheet("log-period");

  // Radix Tabs only mounts the active panel.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SegmentedControl<Tab>
        aria-label="Insights"
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col [&>[role=tabpanel]]:min-h-0 [&>[role=tabpanel]]:flex-1"
        options={[
          {
            value: "patterns",
            label: "Patterns",
            panel: (
              <PatternsTab
                flags={flags}
                insights={computeInsights({ periods, logs, workouts, profile })}
                completedCycles={completedCycles(periods, profile).length}
                onCheckIn={() => setSheet("check-in")}
              />
            ),
          },
          {
            value: "cycles",
            label: "Cycles",
            panel: (
              <CyclesTab
                hasPeriods={periods.length > 0}
                summary={cycleSummary(periods, profile, today)}
                cycles={recentCycles(periods, profile)}
                onLogPeriod={logPeriod}
              />
            ),
          },
          {
            value: "report",
            label: "Report",
            panel: <ReportTab periods={periods} profile={profile} logs={logs} today={today} onLogPeriod={logPeriod} />,
          },
        ]}
      />
      <CheckInSheet
        date={today}
        today={today}
        open={sheet === "check-in"}
        onOpenChange={(open) => setSheet(open ? "check-in" : null)}
        onSaved={() => {
          setSheet(null);
          setToastOpen(true);
        }}
      />
      <LogPeriodSheet
        open={sheet === "log-period"}
        onOpenChange={(open) => setSheet(open ? "log-period" : null)}
        today={today}
        typicalPeriodLength={profile?.typicalPeriodLength ?? null}
      />
      <Toast message="Check-in saved" open={toastOpen} onOpenChange={setToastOpen} />
    </div>
  );
}
