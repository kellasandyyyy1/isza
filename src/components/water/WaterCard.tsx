"use client";

import { IconChevronRight, IconPlus } from "@tabler/icons-react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import {
  HIDE_WHEN_SHORT,
  HIDE_WHEN_TIGHT,
  PLAN_CARD_COMPACT,
  PLAN_CARD_FRAME,
  PLAN_CARD_NOTE_LINE,
  PLAN_CARD_TITLE_ONLY,
  PLAN_CARD_TITLE_ONLY_WHEN_TIGHT,
  type PlanCardRoom,
} from "@/components/today/planCardLayout";
import { useClamped } from "@/components/today/useClamped";
import { Card } from "@/components/ui/Card";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { cx } from "@/lib/cx";
import { waterCountText } from "@/lib/water";

interface WaterCardProps {
  count: number;
  onAdd: () => void;
  onOpen: () => void;
  // Today's rotating line, under the count.
  note?: string;
  // The carousel's compact mode and how much room Today leaves, like the other plan cards.
  compact?: boolean;
  room?: PlanCardRoom;
  className?: string;
}

// The water tally on Today, at the same height and padding as the other plan cards. The mascot stands in the left
// column, from the top padding down. Beside her a grid keeps the plus button in its own 44px column at the top
// right, so text never runs under it, and the daily line runs under both. A tap on plus adds a glass right there;
// a tap anywhere else opens the water sheet. No goal and no ring. Until a glass is logged, the count shows as a
// highlighted pill.
export function WaterCard({
  count,
  onAdd,
  onOpen,
  note,
  compact = false,
  room = "roomy",
  className,
}: WaterCardProps) {
  const titleOnly = room === "heavy";
  const hideLine = cx(compact && HIDE_WHEN_SHORT, room === "light" && HIDE_WHEN_TIGHT);
  const reduced = useReducedMotion() === true;
  const [fill, animate] = useAnimate<HTMLSpanElement>();
  const [ref, clamped] = useClamped<HTMLDivElement>();

  function add() {
    onAdd();
    // A brief fill behind the plus, so the tap reads as counted.
    if (!reduced && fill.current) {
      void animate(fill.current, { scale: [0.4, 1.15, 1], opacity: [0.5, 0.35, 0] }, { duration: 0.45, ease: "easeOut" });
    }
  }

  return (
    <Card
      className={cx(
        PLAN_CARD_FRAME,
        compact && PLAN_CARD_COMPACT,
        titleOnly && PLAN_CARD_TITLE_ONLY,
        room === "light" && PLAN_CARD_TITLE_ONLY_WHEN_TIGHT,
        className,
      )}
    >
      <div className="flex h-full gap-3">
        {/* Hidden wherever the cards are title rows: under 700px tall, and on a crowded Today. */}
        {!titleOnly && (
          <MascotSlot pose="water" size="column" motion="idle" className={cx("self-start", hideLine)} />
        )}
        <div
          ref={ref}
          className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_44px] content-start gap-x-3 gap-y-1"
        >
          <h2 className="flex min-h-9 min-w-0 items-center text-body-strong text-ink">
            <button type="button" aria-haspopup="dialog" onClick={onOpen} className="text-left after:absolute after:inset-0">
              Drink water
            </button>
          </h2>
          {/* Its own column, above the card's tap layer: a tap here only adds a glass. */}
          <button
            type="button"
            aria-label="Add a glass"
            onClick={add}
            className="relative z-10 inline-flex size-11 items-center justify-center rounded-pill bg-surface-2 text-ink transition-colors hover:bg-line"
          >
            <motion.span ref={fill} aria-hidden className="absolute inset-0 rounded-pill bg-primary opacity-0" />
            <IconPlus size={20} stroke={1.75} aria-hidden className="relative" />
          </button>
          {/* Under the title row, across both columns: below the plus, so it never runs under it. */}
          <p aria-live="polite" className="col-span-2 text-small">
            <span
              data-water-count
              className={
                count === 0
                  ? // One line at 360px wide: caption size, no wrapping, an ellipsis if it ever runs out of room.
                    "inline-block max-w-full truncate rounded-pill bg-primary-tint px-2.5 py-0.5 align-top text-caption font-semibold text-primary"
                  : "font-semibold text-ink"
              }
            >
              {waterCountText(count)}
            </span>
          </p>
          {!titleOnly && note && (
            <p
              data-clamp
              data-daily-note
              className={cx("col-span-2 pr-5", PLAN_CARD_NOTE_LINE, hideLine)}
            >
              {note}
            </p>
          )}
        </div>
      </div>
      {!titleOnly && clamped && (
        <IconChevronRight
          data-more
          size={16}
          stroke={1.75}
          aria-hidden
          className={cx("absolute right-4 bottom-4 text-ink-muted", hideLine)}
        />
      )}
    </Card>
  );
}
