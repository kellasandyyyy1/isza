import type { Readiness } from "@/lib/readiness";

const signed = (points: number) => (points > 0 ? `+${points}` : String(points));

// The base comes first without a sign; adjustments follow with + or -.
export function ReadinessBreakdown({ readiness }: { readiness: Readiness }) {
  return (
    <dl className="flex flex-col gap-2 text-body">
      {readiness.breakdown.map(({ label, points }, index) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="text-ink">{index === 0 ? points : signed(points)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-line pt-2 text-body-strong">
        <dt className="text-ink">Readiness</dt>
        <dd className="text-ink">
          {readiness.score}, {readiness.band}
        </dd>
      </div>
    </dl>
  );
}
