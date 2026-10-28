import { IconInfoCircle } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { bandAdvice } from "@/content/guidance";
import type { TodayView } from "@/lib/today";
import { CycleDotRing } from "./CycleDotRing";
import { NextPeriodStat } from "./NextPeriodStat";
import { ReadinessStat } from "./ReadinessStat";
import { ReadinessTile } from "./ReadinessTile";

// The ring's largest size: 230px, or what the row's width leaves beside the mascot (75% of the ring, 16px apart).
// Under 380px wide the readiness tile (7rem) sits beside it instead. cqw is the card's content width.
const RING_CAP =
  "[--ring-cap:min(230px,calc((100cqw_-_16px)/1.75))] [@media(max-width:379px)]:[--ring-cap:min(230px,calc(100cqw_-_16px_-_7rem))]";
// The ring fills the row's height between 150px and the cap. cqh and cqw are the ring row's.
const RING =
  "[--ring:clamp(150px,min(100cqh,calc((100cqw_-_16px)/1.75)),230px)] [@media(max-width:379px)]:[--ring:clamp(150px,min(100cqh,calc(100cqw_-_16px_-_7rem)),230px)]";
// Under 380px wide: readiness sits beside the ring and the mascot hides.
const NARROW_ONLY = "[@media(min-width:380px)]:hidden";
const WIDE_ONLY = "[@media(max-width:379px)]:hidden";

interface CycleHeroProps {
  view: TodayView;
  onOpenReadiness: () => void;
  onExplainHiddenPhases: () => void;
}

// Standard, hormonal and irregular modes. Three blocks 20px apart: the ring with the mascot for the phase, the
// next period, then readiness. The card is as tall as its content with the ring at its largest. When Today is
// short on room the card shrinks, and only the ring row gives way, down to a 150px ring.
export function CycleHero({ view, onOpenReadiness, onExplainHiddenPhases }: CycleHeroProps) {
  const { cycle, readiness } = view;
  const phase = cycle.phase;
  const late = view.lateDays !== null;
  const rangeCaption = [view.nextPeriodRange, view.nextPeriodBasis].filter(Boolean).join(" · ");
  const captions = late ? view.lateNotes : view.nextPeriodRange ? [rangeCaption] : [];

  return (
    <Card tone={phase ?? undefined} flat className="min-h-0 shrink [container-type:inline-size] lg:shrink-0">
      {/* The first row is the ring's: as large as the cap allows, smaller only when the card is squeezed. */}
      <div className={`grid h-full grid-rows-[minmax(150px,var(--ring-cap))] gap-5 ${RING_CAP}`}>
        <div className="flex min-h-0 items-center justify-center [container-type:size]">
          <div className={`flex items-end gap-4 ${RING}`}>
            <CycleDotRing cycleState={cycle} size="var(--ring)" />
            {/* 75% of the ring, 100 to 170px, standing on the ring's lower edge. */}
            <div
              className={`shrink-0 ${WIDE_ONLY}`}
              style={{ width: "clamp(100px, calc(var(--ring) * 0.75), 170px)", aspectRatio: "1" }}
            >
              {/* Still when Today opens: no cheer hop, whatever the readiness band. */}
              <MascotSlot pose={phase ?? "today"} size="fill" motion="idle" priority />
            </div>
            <div className={`w-28 shrink-0 self-center ${NARROW_ONLY}`}>
              <ReadinessTile readiness={readiness} onOpen={onOpenReadiness} />
            </div>
          </div>
        </div>

        {(view.nextPeriodText || !phase) && (
          <div className="flex items-start justify-between gap-2">
            {view.nextPeriodText && <NextPeriodStat text={view.nextPeriodText} captions={captions} late={late} />}
            {!phase && (
              <IconButton
                icon={IconInfoCircle}
                aria-label="Why phases are hidden"
                onClick={onExplainHiddenPhases}
                className="-my-2.5 -mr-2.5 ml-auto"
              />
            )}
          </div>
        )}

        <div className={WIDE_ONLY}>
          <ReadinessStat readiness={readiness} advice={bandAdvice[readiness.band]} onOpen={onOpenReadiness} />
        </div>
      </div>
    </Card>
  );
}
