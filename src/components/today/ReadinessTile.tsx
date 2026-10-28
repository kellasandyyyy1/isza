import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { IconTile } from "@/components/ui/IconTile";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { Readiness } from "@/lib/readiness";
import { BAND_STYLES } from "./todayConfig";

// Readiness stacked into a narrow column, beside the cycle ring on phones under 380px wide. The advice line is
// left out for room; the button opens the same breakdown sheet as the full row.
export function ReadinessTile({ readiness, onOpen }: { readiness: Readiness; onOpen: () => void }) {
  const style = BAND_STYLES[readiness.band];
  const source = readiness.isEstimate ? "Estimated" : "From your check-in";
  const label = `Readiness ${readiness.score}, ${readiness.band}, ${source.toLowerCase()}`;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${label}. Show details`}
      onClick={onOpen}
      className="flex w-full min-w-0 flex-col items-center gap-1 rounded-input bg-surface px-2 py-2.5 text-center shadow-card"
    >
      <ProgressRing value={readiness.score} size={44} strokeWidth={4} color={style.ring} label={label}>
        <AnimatedNumber value={readiness.score} className="text-small font-semibold text-ink" />
      </ProgressRing>
      <span className="flex items-center gap-1.5">
        <IconTile icon={style.icon} tone={style.tone} size="xs" />
        <span className="text-body-strong text-ink">{readiness.band}</span>
      </span>
      <span className="w-full truncate text-caption text-ink-muted">{source}</span>
    </button>
  );
}
