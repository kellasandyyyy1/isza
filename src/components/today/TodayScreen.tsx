"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckInSheet } from "@/components/checkin/CheckInSheet";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { SuppliesSheet } from "@/components/me/SuppliesSheet";
import { addPeriod, deletePeriod, updatePeriod } from "@/db/repo";
import { useDismissedFlags, useLogs, usePeriods, useProfile, useSupplies } from "@/db/hooks";
import { lowSupplyAlert } from "@/lib/supplies";
import { buildTodayView, type PeriodQuickAction as PeriodAction } from "@/lib/today";
import { CheckInButton } from "./CheckInButton";
import { CheckInCard } from "./CheckInCard";
import { CycleHero } from "./CycleHero";
import { FlagChip } from "./FlagChip";
import { FlagList } from "./FlagList";
import { FlagsSheet } from "./FlagsSheet";
import { GreetingRow } from "./GreetingRow";
import { HiddenPhasesSheet } from "./HiddenPhasesSheet";
import { LogPeriodSheet } from "./LogPeriodSheet";
import { LowSupplyChip } from "./LowSupplyChip";
import { PeriodPrepCard } from "./PeriodPrepCard";
import { PeriodQuickAction } from "./PeriodQuickAction";
import { NoDataHero } from "./NoDataHero";
import { PlanCarousel } from "./PlanCarousel";
import { PlanGrid } from "./PlanGrid";
import { PlanSheet } from "./PlanSheet";
import { ReadinessBreakdown } from "./ReadinessBreakdown";
import { ReadinessSheet } from "./ReadinessSheet";
import type { PlanTopic } from "./todayConfig";

// Every log, for the personal readiness blend.
const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

// How long the "Period logged" toast offers Undo.
const PERIOD_UNDO_MS = 5000;

type OpenSheet = "readiness" | "flags" | "check-in" | "log-period" | "hidden-phases" | "supplies" | null;

export function TodayScreen() {
  const profile = useProfile();
  const periods = usePeriods();
  const logs = useLogs(ALL_DATES.from, ALL_DATES.to);
  const dismissedFlags = useDismissedFlags();
  const supplies = useSupplies();
  // A check-in notification opens /today?checkin=1: start with the check-in sheet open.
  // Safe for hydration: the server and first client render show the loading state, not the sheet.
  const [sheet, setSheet] = useState<OpenSheet>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkin") === "1"
      ? "check-in"
      : null,
  );
  const [planTopic, setPlanTopic] = useState<PlanTopic | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  // Undo for the last one-tap period change, while its toast is showing.
  const [periodUndo, setPeriodUndo] = useState<(() => Promise<void>) | null>(null);
  const router = useRouter();

  // Drop the parameter so a refresh does not open the sheet again.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("checkin")) router.replace("/today", { scroll: false });
  }, [router]);

  if (
    profile === undefined ||
    periods === undefined ||
    logs === undefined ||
    dismissedFlags === undefined ||
    supplies === undefined
  ) {
    return <div aria-busy="true" className="flex-1" />;
  }

  // Data only loads in the browser, so the clock is never read during prerendering.
  const view = buildTodayView({ profile, periods, logs, dismissedFlags, now: new Date() });
  const { cycle, flags } = view;
  const noData = cycle.mode === "no-data";
  const sheetToggle = (name: Exclude<OpenSheet, null>) => (open: boolean) => setSheet(open ? name : null);
  const checkIn = { logged: view.todayLog !== null, secondary: noData, onOpen: () => setSheet("check-in") };
  const supplyAlert = lowSupplyAlert(cycle, supplies, view.today);
  const { periodAction } = view;

  async function logPeriod(action: PeriodAction) {
    if (action.kind === "start") {
      const id = await addPeriod({ startDate: view.today, endDate: null });
      setPeriodUndo(() => () => deletePeriod(id));
    } else {
      await updatePeriod(action.periodId, { endDate: view.today });
      setPeriodUndo(() => async () => {
        await updatePeriod(action.periodId, { endDate: null });
      });
    }
  }

  return (
    // Under 1024px the children of both columns join one flex column that fills the screen.
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 [@media(min-height:700px)]:gap-3">
      <div className="contents lg:flex lg:flex-col lg:gap-4">
        <GreetingRow greeting={view.greeting} dateLabel={view.dateLabel} />
        {noData ? (
          <NoDataHero onLogPeriod={() => setSheet("log-period")} />
        ) : (
          <CycleHero
            view={view}
            onOpenReadiness={() => setSheet("readiness")}
            onExplainHiddenPhases={() => setSheet("hidden-phases")}
          />
        )}
        {periodAction && <PeriodQuickAction action={periodAction} onTap={() => void logPeriod(periodAction)} />}
        {!noData && (
          <Card className="hidden lg:block">
            <h2 className="mb-3 text-h2 text-ink">Readiness</h2>
            <ReadinessBreakdown readiness={view.readiness} />
          </Card>
        )}
      </div>

      <div className="contents lg:flex lg:flex-col lg:gap-4">
        {view.periodPrep && <PeriodPrepCard text={view.periodPrep} />}
        {flags.length > 0 && <FlagChip flags={flags} onOpen={() => setSheet("flags")} />}
        {supplyAlert && <LowSupplyChip message={supplyAlert} onOpen={() => setSheet("supplies")} />}
        <PlanCarousel guidanceKey={view.guidanceKey} onOpen={setPlanTopic} />
        <PlanGrid guidanceKey={view.guidanceKey} onOpen={setPlanTopic} />
        {flags.length > 0 && (
          <Card className="hidden lg:block">
            <h2 className="mb-3 text-h2 text-ink">Health notes</h2>
            <FlagList flags={flags} />
          </Card>
        )}
        <div className="shrink-0 lg:hidden">
          <CheckInButton {...checkIn} />
        </div>
        <CheckInCard {...checkIn} />
      </div>

      <ReadinessSheet readiness={view.readiness} open={sheet === "readiness"} onOpenChange={sheetToggle("readiness")} />
      <FlagsSheet flags={flags} open={sheet === "flags" && flags.length > 0} onOpenChange={sheetToggle("flags")} />
      <PlanSheet topic={planTopic} guidanceKey={view.guidanceKey} onClose={() => setPlanTopic(null)} />
      <CheckInSheet
        date={view.today}
        today={view.today}
        open={sheet === "check-in"}
        onOpenChange={sheetToggle("check-in")}
        onSaved={() => {
          setSheet(null);
          setToastOpen(true);
        }}
      />
      <Toast message="Check-in saved" open={toastOpen} onOpenChange={setToastOpen} />
      <Toast
        message="Period logged"
        open={periodUndo !== null}
        onOpenChange={(open) => !open && setPeriodUndo(null)}
        action={periodUndo ? { label: "Undo", onClick: () => void periodUndo() } : undefined}
        durationMs={PERIOD_UNDO_MS}
      />
      <LogPeriodSheet
        open={sheet === "log-period"}
        onOpenChange={sheetToggle("log-period")}
        today={view.today}
        typicalPeriodLength={profile?.typicalPeriodLength ?? null}
      />
      <SuppliesSheet open={sheet === "supplies"} onOpenChange={sheetToggle("supplies")} supplies={supplies} pose="today" />
      {(cycle.mode === "hormonal" || cycle.mode === "irregular") && (
        <HiddenPhasesSheet
          mode={cycle.mode}
          open={sheet === "hidden-phases"}
          onOpenChange={sheetToggle("hidden-phases")}
        />
      )}
    </div>
  );
}
