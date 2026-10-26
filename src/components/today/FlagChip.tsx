import { IconAlertTriangle, IconChevronRight } from "@tabler/icons-react";
import { IconTile } from "@/components/ui/IconTile";
import type { HealthFlag } from "@/lib/flags";

// One line with the first flag. Opens the sheet with all flags.
export function FlagChip({ flags, onOpen }: { flags: HealthFlag[]; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onOpen}
      className="flex h-11 w-full shrink-0 items-center gap-2 rounded-pill bg-surface pr-4 pl-2 text-left text-small text-ink shadow-card lg:hidden"
    >
      <IconTile icon={IconAlertTriangle} tone="warning" size="sm" />
      <span className="min-w-0 flex-1 truncate">{flags[0].title}</span>
      {flags.length > 1 && <span className="shrink-0 text-ink-muted">+{flags.length - 1}</span>}
      <IconChevronRight size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
    </button>
  );
}
