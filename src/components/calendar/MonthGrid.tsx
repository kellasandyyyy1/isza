"use client";

import { useRef } from "react";
import { isInMonth, markersFor, sixWeekGrid, type CalendarContext } from "@/lib/calendar";
import { DayCell } from "./DayCell";

const WEEKDAYS = [
  { short: "M", long: "Monday" },
  { short: "T", long: "Tuesday" },
  { short: "W", long: "Wednesday" },
  { short: "T", long: "Thursday" },
  { short: "F", long: "Friday" },
  { short: "S", long: "Saturday" },
  { short: "S", long: "Sunday" },
];
// A horizontal swipe longer than this changes the month.
const SWIPE_PX = 50;

interface MonthGridProps {
  month: Date;
  context: CalendarContext;
  selected: string;
  onSelect: (date: string) => void;
  onSwipe: (direction: 1 | -1) => void;
}

// Always 6 rows of 7 days, so the grid keeps its height from month to month. The weekday row and the 6 day rows
// share one grid and one row gap. Under 1024px the day rows split the height left after the header, the legend
// and the summary strip equally, at least 44px each.
export function MonthGrid({ month, context, selected, onSelect, onSwipe }: MonthGridProps) {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  return (
    // No row gap: the 44px cells already space the dates, and the weekday row sits the same distance above row 1.
    <div className="grid min-h-0 flex-1 grid-rows-[auto_repeat(6,minmax(44px,1fr))] lg:h-114 lg:flex-none">
      <div aria-hidden className="grid grid-cols-7 text-center text-caption text-ink-muted">
        {WEEKDAYS.map(({ short, long }) => (
          <span key={long}>{short}</span>
        ))}
      </div>
      <div
        role="group"
        aria-label={`Days, Monday first`}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - start.y)) onSwipe(dx < 0 ? 1 : -1);
        }}
        // The day rows are the outer grid's own rows, gap included.
        className="row-span-6 grid touch-pan-y grid-cols-7 grid-rows-subgrid"
      >
        {sixWeekGrid(month).map((date) => (
          <DayCell
            key={date}
            date={date}
            markers={markersFor(context, date)}
            inMonth={isInMonth(date, month)}
            selected={date === selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
