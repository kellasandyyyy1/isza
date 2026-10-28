import { IconCalendarStats } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CycleState } from "@/lib/cycle";
import type { CycleBar, CycleSummary } from "@/lib/cycleHistory";
import { CycleBarsChart } from "./CycleBarsChart";
import { CycleStat } from "./CycleStat";

const CONFIDENCE_WORDS: Record<CycleSummary["confidence"], string> = { high: "High", medium: "Medium", low: "Low" };
// The history needs this many completed cycles, the same as the first patterns.
const MIN_CYCLES = 2;

interface CyclesTabProps {
  cycle: CycleState;
  summary: CycleSummary;
  cycles: CycleBar[];
  onLogPeriod: () => void;
}

export function CyclesTab({ cycle, summary, cycles, onLogPeriod }: CyclesTabProps) {
  if (cycles.length < MIN_CYCLES) {
    const { cycleStart, cycleDay } = cycle;
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={IconCalendarStats}
          mascot={{ pose: "insights", size: "sm" }}
          title="Cycle history"
          text="Your cycle history appears after your second period."
          // Without a period there is nothing to show yet, so the one way forward is logging one.
          action={cycleStart === null ? { label: "Log period", onClick: onLogPeriod } : undefined}
        />
        {cycleStart !== null && cycleDay !== null && (
          <Card aria-label="Current cycle" role="region" className="flex items-center justify-between gap-3">
            <span className="text-body-strong text-ink">Current cycle</span>
            <span className="text-small text-ink-muted">
              Started {format(parseISO(cycleStart), "MMM d")} · day {cycleDay}
            </span>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CycleStat label="Average cycle" value={`${summary.avgCycleLength} days`} />
        <CycleStat
          label="Usual range"
          value={summary.usualRange ? `${summary.usualRange.min} to ${summary.usualRange.max} days` : "Not enough data"}
        />
        <CycleStat label="Average period" value={`${summary.avgPeriodLength} days`} />
        <CycleStat label="Confidence" value={CONFIDENCE_WORDS[summary.confidence]} />
      </dl>
      <Card className="flex flex-col gap-3">
        <h2 className="text-h2 text-ink">Last {cycles.length} cycles</h2>
        <CycleBarsChart cycles={cycles} />
        <p className="text-small text-ink-muted">The colored start of each bar is the period.</p>
      </Card>
    </div>
  );
}
