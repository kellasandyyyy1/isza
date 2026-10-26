"use client";

import { IconAlertTriangle, IconMinus, IconPencil, IconPlus } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import { updateSupply } from "@/db/repo";
import type { Supply } from "@/db/schema";
import { isLow } from "@/lib/supplies";

// The count changes right away. "Low" is written out, not only colored.
export function SupplyItem({ supply, onEdit }: { supply: Supply; onEdit: () => void }) {
  const low = isLow(supply);
  const change = (count: number) => supply.id !== undefined && void updateSupply(supply.id, { count });

  return (
    <li className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-strong text-ink">{supply.label}</p>
        <p className="flex items-center gap-1 text-small text-ink-muted">
          {low && <IconAlertTriangle size={16} stroke={1.75} aria-hidden className="text-warning" />}
          {low ? `Low. Low at ${supply.lowAt}` : `Low at ${supply.lowAt}`}
        </p>
      </div>
      <IconButton
        icon={IconMinus}
        aria-label={`${supply.label}: one less`}
        disabled={supply.count === 0}
        onClick={() => change(supply.count - 1)}
        className="bg-surface-2"
      />
      <output aria-live="polite" aria-label={`${supply.label} count`} className="min-w-8 text-center text-body-strong text-ink">
        {supply.count}
      </output>
      <IconButton icon={IconPlus} aria-label={`${supply.label}: one more`} onClick={() => change(supply.count + 1)} className="bg-surface-2" />
      <IconButton icon={IconPencil} aria-label={`Edit ${supply.label}`} onClick={onEdit} />
    </li>
  );
}
