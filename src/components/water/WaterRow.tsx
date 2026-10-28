import { IconGlassFull, IconMinus, IconPlus } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import { waterCountText } from "@/lib/water";

interface WaterRowProps {
  count: number;
  onAdd: () => void;
  onRemove: () => void;
}

// The water tally: a plain count and two buttons. No goal, no ring, no bar, and the same colors at any count.
export function WaterRow({ count, onAdd, onRemove }: WaterRowProps) {
  return (
    <div className="flex min-h-12 items-center gap-3">
      <IconGlassFull size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-body-strong text-ink">Water</p>
        {/* At 0 it simply says nothing is logged, in the muted tone it always uses. */}
        <p aria-live="polite" className="text-small text-ink-muted">
          {waterCountText(count)}
        </p>
      </div>
      <IconButton
        icon={IconMinus}
        aria-label="Remove a glass"
        onClick={onRemove}
        disabled={count === 0}
        className="text-ink-muted"
      />
      <IconButton icon={IconPlus} aria-label="Add a glass" onClick={onAdd} className="bg-surface-2" />
    </div>
  );
}
