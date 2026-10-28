"use client";

import { IconChevronRight, type Icon } from "@tabler/icons-react";
import { ArtIcon, type ArtIconName } from "@/components/ui/ArtIcon";
import { Card } from "@/components/ui/Card";
import { IconTile, type IconTileTone } from "@/components/ui/IconTile";
import { cx } from "@/lib/cx";
import {
  HIDE_WHEN_SHORT,
  HIDE_WHEN_TIGHT,
  PLAN_CARD_COMPACT,
  PLAN_CARD_FRAME,
  PLAN_CARD_NOTE_LINE,
  PLAN_CARD_PHASE_LINE,
  PLAN_CARD_TITLE_ONLY,
  PLAN_CARD_TITLE_ONLY_WHEN_TIGHT,
  type PlanCardRoom,
} from "./planCardLayout";
import { useClamped } from "./useClamped";

interface PlanCardProps {
  title: string;
  icon: Icon;
  tone: IconTileTone;
  // The card's 3D icon. Without one, the colored icon tile shows instead.
  art?: ArtIconName;
  // The phase sentence, then today's rotating line. Two lines each at most; the sheet has the full text.
  text: string;
  note?: string;
  // The neutral phase sentence for this card, shown if the phase sentence is ever empty, so the body never is.
  neutralText: string;
  onOpen: () => void;
  // The mobile carousel: under 700px tall only the title row shows.
  compact?: boolean;
  // How much room Today leaves: "heavy" is a title row at any height, "light" a title row only where full cards
  // would not fit (see PLAN_CARD_TITLE_ONLY_WHEN_TIGHT).
  room?: PlanCardRoom;
  className?: string;
}

// The title row with its 3D icon, the phase line and the daily line, at the shared card height. When a line is cut
// short a chevron shows there is more in the sheet. The button's ::after layer makes the whole card the tap target.
export function PlanCard({
  title,
  icon,
  tone,
  art,
  text,
  note,
  neutralText,
  onOpen,
  compact = false,
  room = "roomy",
  className,
}: PlanCardProps) {
  const [ref, clamped] = useClamped<HTMLDivElement>();
  const showText = room !== "heavy";
  const phaseLine = text.trim() !== "" ? text : neutralText;
  const hideLine = cx(compact && HIDE_WHEN_SHORT, room === "light" && HIDE_WHEN_TIGHT);

  return (
    <Card
      className={cx(
        PLAN_CARD_FRAME,
        compact && PLAN_CARD_COMPACT,
        room === "heavy" && PLAN_CARD_TITLE_ONLY,
        room === "light" && PLAN_CARD_TITLE_ONLY_WHEN_TIGHT,
        className,
      )}
    >
      <div ref={ref} className="flex h-full flex-col gap-2">
        <h2 className="flex items-center gap-3 text-body-strong text-ink">
          {art ? <ArtIcon name={art} /> : <IconTile icon={icon} tone={tone} />}
          <button type="button" aria-haspopup="dialog" onClick={onOpen} className="text-left after:absolute after:inset-0">
            {title}
          </button>
        </h2>
        {showText && (
          <p data-clamp className={cx(PLAN_CARD_PHASE_LINE, hideLine)}>
            {phaseLine}
          </p>
        )}
        {showText && note && (
          // Room on the right for the chevron, so the last line never runs under it.
          <p data-clamp data-daily-note className={cx(PLAN_CARD_NOTE_LINE, "pr-5", hideLine)}>
            {note}
          </p>
        )}
      </div>
      {showText && clamped && (
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
