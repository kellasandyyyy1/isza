import { format, parseISO } from "date-fns";
import type { CycleBar } from "@/lib/cycleHistory";

// Bars are scaled to the longest cycle shown, with room for a 45-day cycle at least.
const MIN_SCALE_DAYS = 45;

// Plain HTML bars, not SVG, so the labels never scale below the type scale.
// Each bar's text says its start date, length and period length, so color is never the only signal.
export function CycleBarsChart({ cycles }: { cycles: CycleBar[] }) {
  const scale = Math.max(MIN_SCALE_DAYS, ...cycles.map((cycle) => cycle.length));
  const percentOf = (days: number) => `${(days / scale) * 100}%`;
  const describe = (cycle: CycleBar) =>
    `${format(parseISO(cycle.startDate), "MMM d")}, ${cycle.length} days` +
    (cycle.periodLength === null ? "" : `, period ${cycle.periodLength} days`);

  return (
    <div role="img" aria-label={`Last ${cycles.length} cycles: ${cycles.map(describe).join("; ")}.`} className="flex flex-col gap-2">
      {cycles.map((cycle) => (
        <div key={cycle.startDate} aria-hidden className="flex flex-col gap-1">
          <p className="text-caption text-ink">{describe(cycle)}</p>
          <div className="relative h-4 overflow-hidden rounded-pill bg-line" style={{ width: percentOf(cycle.length) }}>
            {cycle.periodLength !== null && cycle.periodLength > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-pill bg-period"
                style={{ width: `${(cycle.periodLength / cycle.length) * 100}%` }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
