import { IconEdit } from "@tabler/icons-react";
import { PHASE_NAMES } from "@/components/today/todayConfig";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { CycleState } from "@/lib/cycle";
import { formatNextPeriod, formatPeriodBasis, formatPeriodRange } from "@/lib/today";

interface CalendarSummaryProps {
  cycle: CycleState;
  // Valid cycle lengths so far, for "based on 4 cycles".
  validCycleCount: number;
  today: string;
  onEditPeriod: () => void;
  onCheckIn: () => void;
}

// Always about today, whatever month the grid shows.
export function CalendarSummary({ cycle, validCycleCount, today, onEditPeriod, onCheckIn }: CalendarSummaryProps) {
  const dayLine =
    cycle.cycleDay === null
      ? "No cycle day yet"
      : cycle.phase
        ? `Day ${cycle.cycleDay}, ${PHASE_NAMES[cycle.phase]}`
        : `Day ${cycle.cycleDay}`;
  const nextPeriod = formatNextPeriod(cycle.nextPeriod, today, cycle.status);
  // The same confidence line as Today: the range, then how sure it is. Not while the period is late.
  const range = cycle.status === "late" ? null : formatPeriodRange(cycle.nextPeriod);
  const confidence = range ? `${range} · ${formatPeriodBasis(validCycleCount)}` : null;

  return (
    <Card aria-label="Today" role="region" className="flex shrink-0 flex-col gap-3">
      <div>
        <p className="text-body-strong text-ink">{dayLine}</p>
        {nextPeriod && <p className="text-small text-ink-muted">{nextPeriod}</p>}
        {nextPeriod && confidence && <p className="text-caption text-ink-muted">{confidence}</p>}
      </div>
      {/* Both buttons on one line at 360px: px-3! narrows the sm button's own px-5. */}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={IconEdit} className="shrink-0 px-3! whitespace-nowrap" onClick={onEditPeriod}>
          Edit period
        </Button>
        <Button size="sm" className="flex-1 px-3! whitespace-nowrap" onClick={onCheckIn}>
          Log check-in
        </Button>
      </div>
    </Card>
  );
}
