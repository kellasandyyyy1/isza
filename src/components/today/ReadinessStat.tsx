import { IconChevronRight } from "@tabler/icons-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { IconTile } from "@/components/ui/IconTile";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { Readiness } from "@/lib/readiness";
import { BAND_STYLES } from "./todayConfig";

// No display utility here: each copy sets its own so "hidden" is never overridden.
const rowClasses = "min-h-12 w-full items-center gap-3 rounded-input bg-surface py-1.5 pr-2 pl-1.5 text-left shadow-card";

// A button under 1024px that opens the breakdown sheet. On desktop the breakdown is inline, so it is plain content.
// The score counts to its new value after a check-in; "Estimated" says it rests on the cycle alone.
export function ReadinessStat({ readiness, onOpen }: { readiness: Readiness; onOpen: () => void }) {
  const style = BAND_STYLES[readiness.band];
  const source = readiness.isEstimate ? "Estimated" : "From your check-in";
  const label = `Readiness ${readiness.score}, ${readiness.band}, ${source.toLowerCase()}`;
  const content = (
    <>
      <ProgressRing value={readiness.score} size={40} strokeWidth={4} color={style.ring} label={label}>
        <AnimatedNumber value={readiness.score} className="text-small text-ink" />
      </ProgressRing>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-body-strong text-ink">
          <IconTile icon={style.icon} tone={style.tone} size="xs" />
          {readiness.band}
        </span>
        <span className="text-caption text-ink-muted">{source}</span>
      </span>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${label}. Show details`}
        onClick={onOpen}
        className={`${rowClasses} flex lg:hidden`}
      >
        {content}
        <IconChevronRight size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
      </button>
      <div role="group" aria-label={label} className={`${rowClasses} hidden lg:flex`}>
        {content}
      </div>
    </>
  );
}
