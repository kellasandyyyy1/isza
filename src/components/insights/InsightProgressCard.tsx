import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/Card";
import type { CycleState } from "@/lib/cycle";
import type { InsightProgress } from "@/lib/insights";

// The bar never looks empty: day 1 still shows a sliver.
const MIN_FILL_PERCENT = 3;

// Counts up through the cycle she is in, not down to zero. The one place the tab says patterns are not here yet.
export function InsightProgressCard({ progress, cycle }: { progress: InsightProgress; cycle: CycleState }) {
  const { completedCycles, unlockDate } = progress;
  const { cycleDay } = cycle;
  const dayCount = Math.round(cycle.avgCycleLength ?? 0);
  const dayLabel = cycleDay === null ? null : cycle.cycleLengthIsEstimate ? `Day ${cycleDay}` : `Day ${cycleDay} of about ${dayCount}`;
  const percent = cycleDay === null || dayCount === 0 ? 0 : Math.max(Math.min(cycleDay / dayCount, 1) * 100, MIN_FILL_PERCENT);
  const unlockLine = unlockDate
    ? `Patterns appear after your second period, around ${format(parseISO(unlockDate), "MMM d")}.`
    : "Patterns appear after your second period.";

  return (
    <Card aria-label="Pattern progress" role="region" className="flex shrink-0 flex-col gap-2">
      {/* The tab's heading, under the mascot. */}
      <h2 className="text-body-strong text-ink">{completedCycles === 0 ? "Your first cycle" : "Your second cycle"}</h2>
      {/* No bar before a period is logged: it would only ever be empty. */}
      {dayLabel && (
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="This cycle"
            aria-valuemin={0}
            aria-valuemax={dayCount}
            aria-valuenow={Math.min(cycleDay ?? 0, dayCount)}
            aria-valuetext={dayLabel}
            className="h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-surface-2"
          >
            <div className="h-full rounded-pill bg-ink" style={{ width: `${percent}%` }} />
          </div>
          <span aria-hidden className="shrink-0 text-caption text-ink-muted">
            {dayLabel}
          </span>
        </div>
      )}
      <p className="text-small text-ink-muted">{unlockLine}</p>
    </Card>
  );
}
