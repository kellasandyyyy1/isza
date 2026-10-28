"use client";

import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { WaterRow } from "./WaterRow";

interface WaterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  // Today's rotating water line, the same one the card shows.
  dailyNote: string | null;
  // The phase's water line, when there is one. Only ever here, never on the card.
  note: string | null;
}

// Opened from the Water card on Today: today's line at the top, the phase line under it, then the same tally as
// the check-in details, with plus and minus.
export function WaterSheet({ open, onOpenChange, count, onAdd, onRemove, dailyNote, note }: WaterSheetProps) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Water">
      <div className="flex flex-col gap-3">
        {(dailyNote || note) && (
          <div className="flex flex-col gap-1">
            {dailyNote && <p className="text-body text-ink">{dailyNote}</p>}
            {note && <p className="text-small text-ink-muted">{note}</p>}
          </div>
        )}
        <WaterRow count={count} onAdd={onAdd} onRemove={onRemove} />
      </div>
    </ResponsiveSheet>
  );
}
