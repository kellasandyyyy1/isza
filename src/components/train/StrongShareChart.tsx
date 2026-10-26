import { PHASE_NAMES } from "@/components/today/todayConfig";
import type { Phase } from "@/lib/cycle";
import type { StrongShare } from "@/lib/training";

const BAR_FILLS: Record<Phase, string> = {
  menstrual: "bg-phase-menstrual",
  follicular: "bg-phase-follicular",
  ovulatory: "bg-phase-ovulatory",
  luteal: "bg-phase-luteal",
};

// Plain HTML columns, not SVG, so the labels never scale below the type scale.
// Every bar has its percentage written above it, so the color is never the only signal.
export function StrongShareChart({ shares }: { shares: StrongShare[] }) {
  const summary = shares
    .map(({ phase, percent }) => `${PHASE_NAMES[phase]} ${percent === null ? "no workouts" : `${percent}%`}`)
    .join(", ");

  return (
    <div role="img" aria-label={`Strong sessions by phase: ${summary}.`} className="flex flex-col gap-2">
      <div aria-hidden className="grid h-36 grid-cols-4 items-end gap-3 border-b border-line">
        {shares.map(({ phase, percent }) => (
          <div key={phase} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="text-small text-ink">{percent === null ? "None" : `${percent}%`}</span>
            <div className={`w-full max-w-11 rounded-t-input ${BAR_FILLS[phase]}`} style={{ height: `${((percent ?? 0) / 100) * 75}%` }} />
          </div>
        ))}
      </div>
      <div aria-hidden className="grid grid-cols-4 gap-3">
        {shares.map(({ phase }) => (
          <span key={phase} className="truncate text-center text-caption text-ink-muted">
            {PHASE_NAMES[phase]}
          </span>
        ))}
      </div>
    </div>
  );
}
