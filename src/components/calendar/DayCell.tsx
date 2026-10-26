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

// Markers: filled circle (period), dashed circle (predicted), dot above (fertile),
// dot below (check-in), ring (today). Each has a shape, so color is never the only signal.
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
      className={cx(
        "flex h-full min-h-11 w-full items-center justify-center rounded-input transition-colors",
        selected ? "bg-surface-2" : "hover:bg-surface-2",
      )}
    >
      <span
        className={cx(
          "relative flex aspect-square h-full max-h-11 items-center justify-center rounded-pill text-small",
          markers.loggedPeriod
            ? "bg-period font-semibold text-on-period"
            : inMonth
              ? "text-ink"
              : "text-ink-muted",
          markers.predictedPeriod && "border-2 border-dashed border-period",
          markers.today && "ring-2 ring-ink",
        )}
      >
        {markers.fertile && <span aria-hidden className="absolute top-1 size-1.5 rounded-pill bg-phase-ovulatory" />}
        {Number(date.slice(8))}
        {markers.checkIn && (
          <span
            aria-hidden
            className={cx("absolute bottom-1 size-1 rounded-pill", markers.loggedPeriod ? "bg-on-period" : "bg-ink-muted")}
          />
        )}
      </span>
    </button>
  );
}
