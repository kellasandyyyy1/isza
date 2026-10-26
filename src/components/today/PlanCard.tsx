import type { Icon } from "@tabler/icons-react";
import { ArtIcon, type ArtIconName } from "@/components/ui/ArtIcon";
import { Card } from "@/components/ui/Card";
import { IconTile, type IconTileTone } from "@/components/ui/IconTile";
import { cx } from "@/lib/cx";

interface PlanCardProps {
  title: string;
  icon: Icon;
  tone: IconTileTone;
  art?: ArtIconName;
  text: string;
  onOpen: () => void;
  // Limits the text to 3 lines so the mobile carousel keeps its height. Under 700px tall only the title
  // shows; the full tip opens in the plan sheet.
  compact?: boolean;
  className?: string;
}

// The button's ::after layer covers the whole card, so the full card is the tap target.
export function PlanCard({ title, icon, tone, art, text, onOpen, compact = false, className }: PlanCardProps) {
  return (
    <Card
      className={cx(
        "relative flex flex-col gap-2 overflow-hidden",
        // Under 700px tall a compact card is a short title row: less padding, no text.
        compact && "[@media(max-height:699px)]:px-4 [@media(max-height:699px)]:py-2",
        className,
      )}
    >
      <h2 className="flex items-center gap-3 text-body-strong text-ink">
        {art ? <ArtIcon name={art} /> : <IconTile icon={icon} tone={tone} />}
        <button type="button" aria-haspopup="dialog" onClick={onOpen} className="text-left after:absolute after:inset-0">
          {title}
        </button>
      </h2>
      <p className={cx("text-small text-ink-muted", compact && "line-clamp-3 [@media(max-height:699px)]:hidden")}>{text}</p>
    </Card>
  );
}
