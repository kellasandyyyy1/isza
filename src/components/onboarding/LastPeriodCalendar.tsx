"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { monthGrid } from "@/lib/calendar";
import { cx } from "@/lib/cx";
import { LAST_PERIOD_WINDOW_DAYS, isLastPeriodSelectable } from "@/lib/onboarding";
import { shiftDate } from "@/lib/cycle";

const WEEKDAYS = [
  { short: "S", long: "Sunday" },
  { short: "M", long: "Monday" },
  { short: "T", long: "Tuesday" },
  { short: "W", long: "Wednesday" },
  { short: "T", long: "Thursday" },
  { short: "F", long: "Friday" },
  { short: "S", long: "Saturday" },
];

interface LastPeriodCalendarProps {
  value: string | null;
  onChange: (date: string) => void;
  today: string;
  labelledBy: string;
}

// Compact month view. Only today and the 59 days before it can be picked.
export function LastPeriodCalendar({ value, onChange, today, labelledBy }: LastPeriodCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value ?? today)));
  const firstSelectable = shiftDate(today, -(LAST_PERIOD_WINDOW_DAYS - 1));
  const monthStart = format(month, "yyyy-MM-dd");
  const canGoBack = monthStart > firstSelectable;
  const canGoForward = monthStart < format(startOfMonth(parseISO(today)), "yyyy-MM-dd");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <IconButton
          icon={IconChevronLeft}
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setMonth((current) => addMonths(current, -1))}
        />
        <p aria-live="polite" className="text-body-strong text-ink">
          {format(month, "MMMM yyyy")}
        </p>
        <IconButton
          icon={IconChevronRight}
          aria-label="Next month"
          disabled={!canGoForward}
          onClick={() => setMonth((current) => addMonths(current, 1))}
        />
      </div>
      <table aria-labelledby={labelledBy} className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            {WEEKDAYS.map(({ short, long }) => (
              <th key={long} scope="col" abbr={long} className="pb-1 text-caption text-ink-muted">
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => (
                <td key={dayIndex} className="p-0 text-center">
                  {date && (
                    <button
                      type="button"
                      disabled={!isLastPeriodSelectable(date, today)}
                      aria-pressed={date === value}
                      aria-current={date === today ? "date" : undefined}
                      aria-label={`${format(parseISO(date), "EEEE, MMMM d")}${date === today ? ", today" : ""}`}
                      onClick={() => onChange(date)}
                      className={cx(
                        "inline-flex size-11 items-center justify-center rounded-pill text-body transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        date === value
                          ? "bg-period font-semibold text-on-period"
                          : "text-ink enabled:hover:bg-surface-2",
                        date === today && date !== value && "border-2 border-ink font-semibold",
                      )}
                    >
                      {Number(date.slice(8))}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
