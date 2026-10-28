import { format, parseISO } from "date-fns";
import type { Workout } from "@/db/schema";
import { phaseForDate, type CalendarContext } from "@/lib/calendar";
import { cx } from "@/lib/cx";
import { newestFirst, weekDates } from "@/lib/training";
import { PHASE_DOTS, workoutTypeInfo } from "./workoutConfig";

interface WeekStripProps {
  context: CalendarContext;
  workouts: Workout[];
}

// "strength" but "HIIT", for the spoken label.
const spoken = (label: string) => (label === label.toUpperCase() ? label : label.toLowerCase());

// Monday to Sunday. Not interactive: each day is read out by its aria-label.
export function WeekStrip({ context, workouts }: WeekStripProps) {
  return (
    <ol aria-label="This week" className="grid shrink-0 grid-cols-7">
      {weekDates(context.today).map((date) => {
        const day = parseISO(date);
        const phase = phaseForDate(context, date)?.phase ?? null;
        const workout = newestFirst(workouts.filter((item) => item.date === date))[0];
        const info = workout ? workoutTypeInfo(workout.type) : null;
        const isToday = date === context.today;
        const label = [
          format(day, "EEEE"),
          phase,
          info ? `${spoken(info.label)} logged` : "no workout",
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <li
            key={date}
            aria-label={label}
            aria-current={isToday ? "date" : undefined}
            data-workout={workout?.type}
            data-phase={phase ?? undefined}
            className="flex flex-col items-center gap-1"
          >
            <span aria-hidden className="text-caption text-ink-muted">
              {format(day, "EEEEE")}
            </span>
            <span
              aria-hidden
              className={cx(
                "flex size-9 items-center justify-center rounded-pill text-ink",
                info ? "bg-surface-2" : "border-2 border-line",
                isToday && "ring-2 ring-ink",
              )}
            >
              {info && <info.icon size={20} stroke={1.75} />}
            </span>
            <span aria-hidden className={cx("size-1.5 rounded-pill", phase && PHASE_DOTS[phase])} />
          </li>
        );
      })}
    </ol>
  );
}
