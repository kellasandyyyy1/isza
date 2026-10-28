import { format, parseISO } from "date-fns";
import type { DayMarkers } from "@/lib/calendar";
import { cx } from "@/lib/cx";

interface DayCellProps {
  date: string;
  markers: DayMarkers;
  inMonth: boolean;
  selected: boolean;
  onSelect: (date: string) => void;
}

function labelFor(date: string, markers: DayMarkers): string {
  const parts = [format(parseISO(date), "EEEE, MMMM d")];
  if (markers.loggedPeriod) parts.push("period");
  if (markers.predictedPeriod) parts.push("predicted period");
  if (markers.fertile) parts.push("fertile window");
  if (markers.checkIn) parts.push("check-in");
  if (markers.today) parts.push("today");
  return parts.join(", ");
}

// Markers: filled circle (period), dashed circle (predicted), soft band behind the days (fertile),
// dot below (check-in), ring (today), filled rounded square (selected).
// Each has a shape, so color is never the only signal.
export function DayCell({ date, markers, inMonth, selected, onSelect }: DayCellProps) {
  return (
    <button
      type="button"
      data-date={date}
      data-period={markers.loggedPeriod ? "logged" : markers.predictedPeriod ? "predicted" : undefined}
      data-fertile={markers.fertile || undefined}
      data-checkin={markers.checkIn || undefined}
      aria-label={labelFor(date, markers)}
      aria-pressed={selected}
      aria-current={markers.today ? "date" : undefined}
      onClick={() => onSelect(date)}
      className="group relative flex h-full min-h-11 w-full items-center justify-center"
    >
      <span
        aria-hidden
        data-selected-mark={selected || undefined}
        className={cx(
          "absolute top-1/2 left-1/2 size-11 -translate-1/2 rounded-input transition-colors",
          selected ? "bg-selected-bg" : "group-hover:bg-surface-2",
        )}
      />
      {markers.fertile && (
        <span
          aria-hidden
          data-fertile-band={markers.fertileStart ? "start" : markers.fertileEnd ? "end" : "middle"}
          className={cx(
            "absolute inset-x-0 top-1/2 h-9 -translate-y-1/2 bg-fertile-band",
            markers.fertileStart && "rounded-l-pill",
            markers.fertileEnd && "rounded-r-pill",
          )}
        />
      )}
      <span
        className={cx(
          "relative flex size-9 items-center justify-center rounded-pill text-body",
          (markers.today || markers.loggedPeriod) && "font-semibold",
          // On the fertile band this month's dates use --fertile-ink, which passes 4.5:1 on it.
          markers.loggedPeriod
            ? "bg-period text-on-period"
            : !inMonth
              ? "text-ink-muted"
              : markers.fertile
                ? "text-fertile-ink"
                : "text-ink",
          markers.predictedPeriod && "border-2 border-dashed border-period",
          markers.today && "ring-2 ring-ink",
        )}
      >
        {Number(date.slice(8))}
        {markers.checkIn && (
          <span
            aria-hidden
            className={cx("absolute bottom-0.5 size-1 rounded-pill", markers.loggedPeriod ? "bg-on-period" : "bg-ink-muted")}
          />
        )}
      </span>
    </button>
  );
}
