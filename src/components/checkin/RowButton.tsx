import { IconChevronRight } from "@tabler/icons-react";

interface RowButtonProps {
  id: string;
  label: string;
  // Short extra text after the label, such as a count.
  detail?: string;
  onClick: () => void;
}

export function RowButton({ id, label, detail, onClick }: RowButtonProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between gap-2 rounded-pill bg-surface-2 pr-2 pl-4 text-small text-ink transition-colors hover:bg-line"
    >
      <span className="truncate">
        {label}
        {detail && <span className="font-bold"> {detail}</span>}
      </span>
      <IconChevronRight size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
    </button>
  );
}
