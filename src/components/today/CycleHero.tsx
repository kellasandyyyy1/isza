import { IconInfoCircle } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { IconTile } from "@/components/ui/IconTile";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { bandAdvice } from "@/content/guidance";
import type { TodayView } from "@/lib/today";
import { NextPeriodStat } from "./NextPeriodStat";
import { ReadinessStat } from "./ReadinessStat";
import { HERO_RING_SIZE, PHASE_ICONS, PHASE_NAMES } from "./todayConfig";

interface CycleHeroProps {
  view: TodayView;
  onOpenReadiness: () => void;
  onExplainHiddenPhases: () => void;
}

// Standard, hormonal and irregular modes. Without a phase the ring shows only the cycle day.
// Under 1024px the hero takes the space left on the Today screen. Its top row is a size container,
// so the ring and mascot shrink to fit it instead of pushing the screen into scrolling.
export function CycleHero({ view, onOpenReadiness, onExplainHiddenPhases }: CycleHeroProps) {
  const { cycle, readiness, ringPercent, nextPeriodText, nextPeriodRange, mood } = view;
  const phase = cycle.phase;
  const advice = bandAdvice[readiness.band];
  const ringLabel = phase ? `Cycle day ${cycle.cycleDay}, ${PHASE_NAMES[phase]} phase` : `Cycle day ${cycle.cycleDay}`;

  return (
    <Card
      tone={phase ?? undefined}
      flat
      className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_auto] gap-2 lg:flex-none lg:grid-rows-none [@media(min-height:700px)]:gap-3"
    >
      <div className="flex min-h-0 items-center gap-3 [container-type:size] lg:[container-type:normal]">
        <ProgressRing
          value={ringPercent ?? 0}
          size={196}
          strokeWidth={16}
          displaySize={HERO_RING_SIZE}
          color={phase ?? "ink"}
          label={ringLabel}
        >
          <span className="flex flex-col items-center">
            {phase && (
              <IconTile
                icon={PHASE_ICONS[phase]}
                tone={phase}
                size="sm"
                // Hidden in a short row so the ring can shrink; the phase name stays as text.
                className="mb-1 [@container(max-height:119px)]:hidden"
              />
            )}
            <span className="text-h1 text-ink">Day {cycle.cycleDay}</span>
            {phase && <span className="text-small text-ink-muted">{PHASE_NAMES[phase]}</span>}
          </span>
        </ProgressRing>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2">
          <MascotSlot
            pose="today"
            size="sm"
            motion={mood}
            phase={phase}
            priority
            // Hidden when the row is too short to hold her above the next period line.
            className="[@container(max-height:179px)]:hidden [@media(max-height:639px)]:hidden"
          />
          {nextPeriodText && <NextPeriodStat text={nextPeriodText} range={nextPeriodRange} />}
          {phase === null && (
            <IconButton icon={IconInfoCircle} aria-label="Why phases are hidden" onClick={onExplainHiddenPhases} />
          )}
        </div>
      </div>
      <ReadinessStat readiness={readiness} onOpen={onOpenReadiness} />
      <p className="text-small text-ink">{advice}</p>
    </Card>
  );
}
