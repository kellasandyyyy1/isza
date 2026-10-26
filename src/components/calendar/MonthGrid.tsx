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

// 6 rows of 7 days. Under 1024px the rows share the height left between the header and the legend.
export function MonthGrid({ month, context, selected, onSelect, onSwipe }: MonthGridProps) {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 lg:flex-none">
      <div aria-hidden className="grid shrink-0 grid-cols-7 text-center text-caption text-ink-muted">
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
        className="grid min-h-0 flex-1 touch-pan-y grid-cols-7 grid-rows-6 lg:h-108 lg:flex-none"
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
