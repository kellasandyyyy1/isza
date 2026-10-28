"use client";

import { addMonths, format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { useState } from "react";
import { CheckInSheet } from "@/components/checkin/CheckInSheet";
import { Card } from "@/components/ui/Card";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Toast } from "@/components/ui/Toast";
import { useIsDesktop } from "@/components/ui/useIsDesktop";
import { useLogs, usePeriods, useProfile, useWorkouts } from "@/db/hooks";
import { buildCalendarContext, legendMarkers, sixWeekGrid } from "@/lib/calendar";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarSummary } from "./CalendarSummary";
import { DayDetails } from "./DayDetails";
import { LegendSheet } from "./LegendSheet";
import { MonthGrid } from "./MonthGrid";
import { MonthHeader } from "./MonthHeader";

const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

type OpenSheet = "day" | "legend" | "check-in" | null;

export function CalendarScreen() {
  const profile = useProfile();
  const periods = usePeriods();
  const logs = useLogs(ALL_DATES.from, ALL_DATES.to);
  const workouts = useWorkouts(ALL_DATES.from, ALL_DATES.to);
  const isDesktop = useIsDesktop();
  // Null until the user moves: then the current month and today are used.
  const [month, setMonth] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Edit period opens the day details on the period editor. The count remounts them on every tap.
  const [details, setDetails] = useState<{ view: "summary" | "period"; count: number }>({ view: "summary", count: 0 });
  // Null means today, for the summary strip's Log check-in.
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [toastOpen, setToastOpen] = useState(false);

  if (profile === undefined || periods === undefined || logs === undefined || workouts === undefined) {
    return <div aria-busy="true" className="flex-1" />;
  }

  // Data only loads in the browser, so the clock is never read during prerendering.
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const shownMonth = month ?? startOfMonth(now);
  const selectedDate = selected ?? today;
  const context = buildCalendarContext({ periods, profile, logs, workouts, today });
  const typicalPeriodLength = profile?.typicalPeriodLength ?? null;

  const changeMonth = (direction: 1 | -1) => setMonth(addMonths(shownMonth, direction));
  function selectDay(date: string) {
    setSelected(date);
    setDetails((current) => ({ view: "summary", count: current.count }));
    if (!isSameMonth(parseISO(date), shownMonth)) setMonth(startOfMonth(parseISO(date)));
    if (!isDesktop) setSheet("day");
  }
  // Today's period editor, without moving the grid away from the month on screen.
  function editTodaysPeriod() {
    setSelected(today);
    setDetails((current) => ({ view: "period", count: current.count + 1 }));
    if (!isDesktop) setSheet("day");
  }
  // One sheet at a time: the day sheet closes before the check-in sheet opens.
  const editCheckIn = (date: string) => {
    setSelected(date);
    setCheckInDate(date);
    setSheet("check-in");
  };
  const logTodaysCheckIn = () => {
    setCheckInDate(null);
    setSheet("check-in");
  };
  const toggle = (name: Exclude<OpenSheet, null>) => (open: boolean) => setSheet(open ? name : null);

  const dayDetails = (
    <DayDetails
      key={`${selectedDate}-${details.view}-${details.count}`}
      date={selectedDate}
      context={context}
      periods={periods}
      typicalPeriodLength={typicalPeriodLength}
      onEditCheckIn={editCheckIn}
      showDateHeading={isDesktop}
      initialView={details.view}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-6">
      <section aria-label="Calendar" className="flex min-h-0 flex-1 flex-col gap-2">
        <MonthHeader
          month={shownMonth}
          isCurrentMonth={isSameMonth(shownMonth, now)}
          onPrevious={() => changeMonth(-1)}
          onNext={() => changeMonth(1)}
          onToday={() => {
            setMonth(null);
            setSelected(null);
          }}
          onExplain={() => setSheet("legend")}
        />
        <MonthGrid month={shownMonth} context={context} selected={selectedDate} onSelect={selectDay} onSwipe={changeMonth} />
        <CalendarLegend markers={legendMarkers(context, sixWeekGrid(shownMonth))} onExplain={() => setSheet("legend")} />
        <CalendarSummary
          cycle={context.cycle}
          validCycleCount={context.cycles.length}
          today={today}
          onEditPeriod={editTodaysPeriod}
          onCheckIn={logTodaysCheckIn}
        />
      </section>

      {isDesktop && (
        <Card aria-label="Selected day" role="region">
          {dayDetails}
        </Card>
      )}

      {!isDesktop && (
        <ResponsiveSheet
          open={sheet === "day"}
          onOpenChange={toggle("day")}
          title={format(parseISO(selectedDate), "EEEE, MMMM d")}
        >
          {dayDetails}
        </ResponsiveSheet>
      )}
      <LegendSheet open={sheet === "legend"} onOpenChange={toggle("legend")} />
      <CheckInSheet
        date={checkInDate ?? today}
        today={today}
        open={sheet === "check-in"}
        onOpenChange={toggle("check-in")}
        onSaved={() => {
          setSheet(null);
          setToastOpen(true);
        }}
      />
      <Toast message="Check-in saved" open={toastOpen} onOpenChange={setToastOpen} />
    </div>
  );
}
