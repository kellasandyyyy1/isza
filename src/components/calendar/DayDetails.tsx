"use client";

import { IconCalendarEvent, IconNotes } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { useEffect, useId, useRef, useState } from "react";
import { PHASE_NAMES } from "@/components/today/todayConfig";
import { Button } from "@/components/ui/Button";
import type { Period } from "@/db/schema";
import { periodContaining, phaseForDate, type CalendarContext } from "@/lib/calendar";
import { LogSummary } from "./LogSummary";
import { PeriodEditor } from "./PeriodEditor";
import { RemovePeriodConfirm } from "./RemovePeriodConfirm";

interface DayDetailsProps {
  date: string;
  context: CalendarContext;
  periods: Period[];
  typicalPeriodLength: number | null;
  onEditCheckIn: (date: string) => void;
  // The desktop panel shows the date as a heading; the mobile sheet has it in its title.
  showDateHeading?: boolean;
  // "period" opens straight on the period editor, for the summary strip's Edit period.
  initialView?: "summary" | "period";
}

type View = "summary" | "period" | "remove-period";

function phaseLine(context: CalendarContext, date: string): string {
  const dayPhase = phaseForDate(context, date);
  if (!dayPhase) return "No cycle prediction for this day yet.";
  const prefix = dayPhase.predicted ? "Predicted: " : "";
  const phase = dayPhase.phase ? `, ${PHASE_NAMES[dayPhase.phase].toLowerCase()} phase` : "";
  return `${prefix}cycle day ${dayPhase.cycleDay}${phase}`;
}

// Key this by date so each day starts on its summary.
export function DayDetails(props: DayDetailsProps) {
  const { date, context, periods, typicalPeriodLength, onEditCheckIn, showDateHeading = false, initialView = "summary" } = props;
  const baseId = useId();
  const ids = { heading: `${baseId}-heading`, periodButton: `${baseId}-period-button` };
  const [view, setView] = useState<View>(initialView);
  const focusTarget = useRef<string | null>(null);
  const future = date > context.today;
  const period = periodContaining(periods, date, context.today);

  useEffect(() => {
    if (focusTarget.current) document.getElementById(focusTarget.current)?.focus();
  }, [view]);

  function goTo(next: View, focusId: string) {
    focusTarget.current = focusId;
    setView(next);
  }

  if (view === "period") {
    return (
      <PeriodEditor
        headingId={ids.heading}
        date={date}
        today={context.today}
        period={period}
        periods={periods}
        typicalPeriodLength={typicalPeriodLength}
        onBack={() => goTo("summary", ids.periodButton)}
        onRemove={() => goTo("remove-period", ids.heading)}
      />
    );
  }

  if (view === "remove-period" && period) {
    return (
      <RemovePeriodConfirm
        headingId={ids.heading}
        period={period}
        onDone={() => goTo("summary", ids.periodButton)}
        onKeep={() => goTo("period", ids.heading)}
      />
    );
  }

  const line = phaseLine(context, date);
  return (
    <div className="flex flex-col gap-4">
      {showDateHeading && <h2 className="text-h2 text-ink">{format(parseISO(date), "EEEE, MMMM d")}</h2>}
      <p className="text-body-strong text-ink">{line.charAt(0).toUpperCase() + line.slice(1)}</p>
      {!future && (
        <>
          <LogSummary log={context.logsByDate.get(date) ?? null} workouts={context.workoutsByDate.get(date) ?? []} />
          <div className="flex flex-col gap-2">
            <Button fullWidth icon={IconNotes} onClick={() => onEditCheckIn(date)}>
              Edit check-in
            </Button>
            <Button
              id={ids.periodButton}
              fullWidth
              variant="secondary"
              icon={IconCalendarEvent}
              onClick={() => goTo("period", ids.heading)}
            >
              Edit period dates
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
