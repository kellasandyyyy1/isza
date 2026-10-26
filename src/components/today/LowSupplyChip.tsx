import { IconChevronRight, IconShoppingBag } from "@tabler/icons-react";
import { IconTile } from "@/components/ui/IconTile";

// Shown when a period is predicted within 5 days and a supply is low. Opens the supplies sheet.
export function LowSupplyChip({ message, onOpen }: { message: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onOpen}
      className="flex h-11 w-full shrink-0 items-center gap-2 rounded-pill bg-surface pr-4 pl-2 text-left text-small text-ink shadow-card"
    >
      <IconTile icon={IconShoppingBag} tone="period" size="sm" />
      <span className="min-w-0 flex-1 truncate">{message}</span>
      <IconChevronRight size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
    </button>
  );
}
