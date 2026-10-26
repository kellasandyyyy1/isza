import { IconCalendarStats } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CycleBar, CycleSummary } from "@/lib/cycleHistory";
import { CycleBarsChart } from "./CycleBarsChart";
import { CycleStat } from "./CycleStat";

const CONFIDENCE_WORDS: Record<CycleSummary["confidence"], string> = { high: "High", medium: "Medium", low: "Low" };

interface CyclesTabProps {
  hasPeriods: boolean;
  summary: CycleSummary;
  cycles: CycleBar[];
  onLogPeriod: () => void;
}

export function CyclesTab({ hasPeriods, summary, cycles, onLogPeriod }: CyclesTabProps) {
  if (!hasPeriods) {
    return (
      <EmptyState
        icon={IconCalendarStats}
        mascot={{ pose: "insights" }}
        title="No cycles yet"
        text="Log your periods to see your cycle history."
        action={{ label: "Log period", onClick: onLogPeriod }}
      />
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
        <h2 className="text-h2 text-ink">Last {Math.max(cycles.length, 1)} cycles</h2>
        {cycles.length === 0 ? (
          <p className="text-body text-ink-muted">Your first full cycle shows here once your next period starts.</p>
        ) : (
          <>
            <CycleBarsChart cycles={cycles} />
            <p className="text-small text-ink-muted">The colored start of each bar is the period.</p>
          </>
        )}
      </Card>
    </div>
  );
}
