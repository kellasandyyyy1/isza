import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { type CurrentCycleSummary, moodSummaryText, symptomChipLabels } from "@/lib/insights";
import { MoodDots } from "./MoodDots";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <dt className="shrink-0 text-small text-ink-muted">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 text-right text-small text-ink">{children}</dd>
    </div>
  );
}

// Her own logs since the cycle started, from the first check-in. Counts only: no interpretation, comparison,
// advice or phase link. Always shown; rows without data are left out.
export function CycleSoFarCard({ summary }: { summary: CurrentCycleSummary }) {
  const mood = moodSummaryText(summary.moodCounts);
  const chips = symptomChipLabels(summary.topSymptoms, summary.moreSymptoms);

  return (
    <Card aria-label="This cycle so far" role="region" className="flex shrink-0 flex-col gap-3">
      <h3 className="text-body-strong text-ink">This cycle so far</h3>
      {summary.checkInCount === 0 ? (
        <p className="text-small text-ink-muted">Your check-ins will show up here.</p>
      ) : (
        <dl className="flex flex-col gap-2">
          <Row label="Check-ins">{summary.checkInCount}</Row>
          {mood && (
            <Row label="Mood">
              <MoodDots moodCounts={summary.moodCounts} />
              <span>{mood}</span>
            </Row>
          )}
          {summary.avgEnergy !== null && <Row label="Average energy">{summary.avgEnergy.toFixed(1)} of 5</Row>}
          <Row label="Symptoms">
            {chips.length === 0 ? (
              <span className="text-ink-muted">None logged</span>
            ) : (
              chips.map((chip) => (
                <span key={chip} className="rounded-pill bg-surface-2 px-2.5 py-0.5 text-caption text-ink">
                  {chip}
                </span>
              ))
            )}
          </Row>
          {summary.bleedingDays > 0 && <Row label="Period days">{summary.bleedingDays}</Row>}
          {summary.workoutCount > 0 && <Row label="Workouts">{summary.workoutCount}</Row>}
        </dl>
      )}
    </Card>
  );
}
