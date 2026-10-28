import { IconChevronLeft, IconChevronRight, IconInfoCircle } from "@tabler/icons-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

interface MonthHeaderProps {
  month: Date;
  isCurrentMonth: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  // Opens the markers sheet. Shown here only under 700px tall, where the legend row is hidden for room.
  onExplain: () => void;
}

export function MonthHeader({ month, isCurrentMonth, onPrevious, onNext, onToday, onExplain }: MonthHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <h2 aria-live="polite" className="min-w-0 flex-1 truncate text-h2 text-ink">
        {format(month, "MMMM yyyy")}
      </h2>
      {!isCurrentMonth && (
        <Button variant="ghost" size="sm" className="text-ink-muted" onClick={onToday}>
          Today
        </Button>
      )}
      <IconButton
        icon={IconInfoCircle}
        aria-label="What do these mean?"
        onClick={onExplain}
        className="[@media(min-height:700px)]:hidden"
      />
      <IconButton icon={IconChevronLeft} aria-label="Previous month" onClick={onPrevious} />
      <IconButton icon={IconChevronRight} aria-label="Next month" onClick={onNext} />
    </div>
  );
}
