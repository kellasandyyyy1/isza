import { IconChevronRight, type Icon } from "@tabler/icons-react";
import { cx } from "@/lib/cx";

interface MeRowProps {
  icon: Icon;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
}

// 48px row that opens a sheet.
export function MeRow({ icon: RowIcon, label, value, onClick, danger = false }: MeRowProps) {
  return (
    <li>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onClick}
        className="flex h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-surface-2"
      >
        <RowIcon size={20} stroke={1.75} aria-hidden className={cx("shrink-0", danger ? "text-danger" : "text-ink-muted")} />
        <span className={cx("min-w-0 flex-1 truncate text-body", danger ? "text-danger" : "text-ink")}>{label}</span>
        {value && <span className="max-w-[40%] shrink-0 truncate text-small text-ink-muted">{value}</span>}
        <IconChevronRight size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
      </button>
    </li>
  );
}
