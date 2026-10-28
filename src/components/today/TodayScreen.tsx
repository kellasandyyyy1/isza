"use client";

import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckInSheet } from "@/components/checkin/CheckInSheet";
import { MealSheet } from "@/components/meals/MealSheet";
import { useDailyMeal } from "@/components/meals/useDailyMeal";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Toast } from "@/components/ui/Toast";
import { SuppliesSheet } from "@/components/me/SuppliesSheet";
import { WaterSheet } from "@/components/water/WaterSheet";
import type { DailyNoteCard } from "@/content/daily-notes";
import { waterNote } from "@/content/guidance";
import { getDailyNote } from "@/lib/daily-notes";
import { getGuidance } from "@/lib/guidance";
import { addPeriod, changeWaterCount, deletePeriod, updatePeriod } from "@/db/repo";
import {
  useDismissedFlags,
  useLogs,
  usePeriods,
  useProfile,
  useSupplies,
  useWaterLog,
} from "@/db/hooks";
import { lowSupplyAlert } from "@/lib/supplies";
import { buildTodayView, planCardRoom, type PeriodQuickAction as PeriodAction } from "@/lib/today";
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
import { PlanCarousel, type WaterCardData } from "./PlanCarousel";
import { PlanGrid } from "./PlanGrid";
import { PlanSheet } from "./PlanSheet";
import { ReadinessBreakdown } from "./ReadinessBreakdown";
import { ReadinessSheet } from "./ReadinessSheet";
import type { PlanTopic } from "./todayConfig";

// Every log, for the personal readiness blend.
const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

// How long the "Period logged" toast offers Undo.
const PERIOD_UNDO_MS = 5000;

type OpenSheet =
  | "readiness"
  | "flags"
  | "check-in"
  | "log-period"
  | "hidden-phases"
  | "supplies"
  | "meal"
  | "water"
  | null;

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
  const [mealToastOpen, setMealToastOpen] = useState(false);
  // How the check-in sheet was opened: the whole check-in, or the "+" for symptoms. Kept while it closes.
  const [checkInStart, setCheckInStart] = useState<"main" | "symptoms">("main");
  // Undo for the last one-tap period change, while its toast is showing.
  const [periodUndo, setPeriodUndo] = useState<(() => Promise<void>) | null>(null);
  const router = useRouter();

  // Drop the parameter so a refresh does not open the sheet again.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("checkin")) router.replace("/today", { scroll: false });
  }, [router]);

  // Data only loads in the browser, so the clock is never read during prerendering.
  const view =
    profile === undefined || periods === undefined || logs === undefined || dismissedFlags === undefined
      ? null
      : buildTodayView({ profile, periods, logs, dismissedFlags, now: new Date() });
  // Called before the loading return so the hooks keep their order. Undefined while it loads, null when meal ideas
  // are off.
  const meal = useDailyMeal(view?.cycle ?? null, view?.today ?? null);
  // A Food tap while the meal was still loading waits for it; if meal ideas turn out to be off, the tip opens instead.
  if (sheet === "meal" && meal === null) {
    setSheet(null);
    setPlanTopic("food");
  }
  // The same day record as the check-in details, so both show the same count live.
  const waterLog = useWaterLog(view?.today ?? "2000-01-01");

  if (view === null || supplies === undefined) {
    return <div aria-busy="true" className="flex-1" />;
  }

  const { cycle, flags } = view;
  // Each card's rotating line for today: the same all day, a new one tomorrow.
  const noteFor = (card: DailyNoteCard) => getDailyNote(card, view.today, cycle.phase).text;
  const notes = {
    train: noteFor("train"),
    food: noteFor("food"),
    energy: noteFor("energy"),
    sleep: noteFor("sleep"),
    social: noteFor("social"),
  };
  const water: WaterCardData | null =
    waterLog !== undefined
      ? {
          count: waterLog?.count ?? 0,
          note: noteFor("water"),
          onAdd: () => void changeWaterCount(view.today, 1),
          onOpen: () => setSheet("water"),
        }
      : null;
  // The Food card opens today's meal when meal ideas are on (still loading counts), else its phase tip like the
  // other cards.
  const openPlan = (topic: PlanTopic) => (topic === "food" && meal !== null ? setSheet("meal") : setPlanTopic(topic));
  const noData = cycle.mode === "no-data";
  const sheetToggle = (name: Exclude<OpenSheet, null>) => (open: boolean) => setSheet(open ? name : null);
  const openCheckIn = (start: "main" | "symptoms") => {
    setCheckInStart(start);
    setSheet("check-in");
  };
  const checkIn = { logged: view.todayLog !== null, secondary: noData, onOpen: () => openCheckIn("main") };
  const supplyAlert = lowSupplyAlert(cycle, supplies, view.today);
  const { periodAction } = view;
  // Rows beyond the usual ones: the plan carousel gives up room for them. One extra row still leaves room for full
  // cards on tall phones; two or more leave room only for title rows.
  const extraRows = [
    periodAction !== null,
    flags.length > 0,
    view.lateNotes.length > 0,
    supplyAlert !== null,
    view.periodPrep !== null,
  ].filter(Boolean).length;
  const room = planCardRoom(extraRows);

  const { today } = view;
  async function logPeriod(action: PeriodAction) {
    if (action.kind === "start") {
      const id = await addPeriod({ startDate: today, endDate: null });
      setPeriodUndo(() => () => deletePeriod(id));
    } else {
      await updatePeriod(action.periodId, { endDate: today });
      setPeriodUndo(() => async () => {
        await updatePeriod(action.periodId, { endDate: null });
      });
    }
  }

  return (
    // Under 1024px the children of both columns join one flex column that fills the screen.
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 [@media(min-height:700px)]:gap-3">
      <div className="contents lg:flex lg:flex-col lg:gap-4">
        <GreetingRow
          greeting={view.greeting}
          dateLabel={view.dateLabel}
          action={
            <IconButton icon={IconPlus} aria-label="Log a symptom" className="-mr-2.5" onClick={() => openCheckIn("symptoms")} />
          }
        />
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
        <PlanCarousel
          guidanceKey={view.guidanceKey}
          onOpen={openPlan}
          room={room}
          water={water}
          notes={notes}
        />
        <PlanGrid
          guidanceKey={view.guidanceKey}
          onOpen={openPlan}
          water={water}
          notes={notes}
        />
        {flags.length > 0 && (
          <Card className="hidden lg:block">
            <h2 className="mb-3 text-h2 text-ink">Health notes</h2>
            <FlagList flags={flags} />
          </Card>
        )}
        {/* The hero keeps only the height it needs: any space left over sits above this button, in the thumb zone. */}
        <div className="mt-auto shrink-0 lg:hidden">
          <CheckInButton {...checkIn} />
        </div>
        <CheckInCard {...checkIn} />
      </div>

      <ReadinessSheet readiness={view.readiness} open={sheet === "readiness"} onOpenChange={sheetToggle("readiness")} />
      <FlagsSheet flags={flags} open={sheet === "flags" && flags.length > 0} onOpenChange={sheetToggle("flags")} />
      <PlanSheet
        topic={planTopic}
        guidanceKey={view.guidanceKey}
        note={planTopic ? notes[planTopic] : null}
        onClose={() => setPlanTopic(null)}
      />
      <CheckInSheet
        date={view.today}
        today={view.today}
        open={sheet === "check-in"}
        onOpenChange={sheetToggle("check-in")}
        startView={checkInStart}
        onSaved={() => {
          setSheet(null);
          setToastOpen(true);
        }}
      />
      <Toast
        message={checkInStart === "symptoms" ? "Symptoms saved" : "Check-in saved"}
        open={toastOpen}
        onOpenChange={setToastOpen}
      />
      {meal && (
        <MealSheet
          meal={meal}
          guidance={getGuidance(view.guidanceKey, "food")}
          note={notes.food}
          open={sheet === "meal"}
          onOpenChange={sheetToggle("meal")}
          onCooked={() => {
            setSheet(null);
            setMealToastOpen(true);
          }}
        />
      )}
      <Toast message="Marked as cooked" open={mealToastOpen} onOpenChange={setMealToastOpen} />
      {water && (
        <WaterSheet
          open={sheet === "water"}
          onOpenChange={sheetToggle("water")}
          count={water.count}
          onAdd={water.onAdd}
          onRemove={() => void changeWaterCount(view.today, -1)}
          dailyNote={water.note ?? null}
          note={waterNote[view.guidanceKey]}
        />
      )}
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
