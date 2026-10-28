"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MascotSlot } from "@/components/ui/MascotSlot";
import type { CycleState } from "@/lib/cycle";
import type { HealthFlag } from "@/lib/flags";
import type { CurrentCycleSummary, Insight, InsightProgress } from "@/lib/insights";
import { CycleSoFarCard } from "./CycleSoFarCard";
import { ExampleInsightCard } from "./ExampleInsightCard";
import { HealthFlagCard } from "./HealthFlagCard";
import { InsightCard } from "./InsightCard";
import { InsightProgressCard } from "./InsightProgressCard";

const PAGE_SIZE = 5;

interface PatternsTabProps {
  flags: HealthFlag[];
  insights: Insight[];
  progress: InsightProgress;
  cycle: CycleState;
  summary: CurrentCycleSummary;
  checkedInToday: boolean;
  onCheckIn: () => void;
  // "You log water on most days", from 14 logged days. Null before that.
  waterLine?: string | null;
}

// Health flags first. Before 2 completed cycles: the cycle she is in, her logs so far, and an example of what is
// coming, 16px apart from the top; any spare room stays below them. After: insights 5 at a time. The mascot shows
// only while the tab has nothing of hers to show.
export function PatternsTab({
  flags,
  insights,
  progress,
  cycle,
  summary,
  checkedInToday,
  onCheckIn,
  waterLine = null,
}: PatternsTabProps) {
  const [shown, setShown] = useState(PAGE_SIZE);
  // The mascot only fills an empty tab: nothing logged this cycle yet, or no patterns to show.
  const nothingLogged = summary.checkInCount === 0 && summary.workoutCount === 0 && summary.bleedingDays === 0;

  return (
    <div className="flex flex-col gap-4">
      {flags.length > 0 && (
        <section aria-label="Health flags" className="flex flex-col gap-3">
          {flags.map((flag) => (
            <HealthFlagCard key={flag.id} flag={flag} />
          ))}
        </section>
      )}

      {progress.completedCycles < progress.needed ? (
        <section aria-label="Your first patterns" className="flex flex-col gap-4">
          {nothingLogged && <MascotSlot pose="insights" size="sm" className="self-center" />}
          <InsightProgressCard progress={progress} cycle={cycle} />
          <CycleSoFarCard summary={summary} />
          <ExampleInsightCard />
          {!checkedInToday && (
            <Button fullWidth onClick={onCheckIn}>
              Log today&apos;s check-in
            </Button>
          )}
        </section>
      ) : (
        <section aria-label="Your patterns" className="flex flex-col gap-3">
          {insights.length === 0 && (
            <>
              <MascotSlot pose="insights" size="sm" className="self-center" />
              <p className="text-body text-ink-muted">No clear patterns yet. Keep checking in and they will show here.</p>
            </>
          )}
          {insights.slice(0, shown).map((insight) => (
            <InsightCard key={insight.text} insight={insight} />
          ))}
          {insights.length > shown && (
            <Button variant="secondary" fullWidth onClick={() => setShown((count) => count + PAGE_SIZE)}>
              Show more
            </Button>
          )}
        </section>
      )}

      {/* One plain line about how often she logs water. No chart, and no link to mood, energy or symptoms. */}
      {waterLine && <p className="text-small text-ink-muted">{waterLine}</p>}
    </div>
  );
}
