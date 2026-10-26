import { IconDroplet } from "@tabler/icons-react";
import type { PeriodQuickAction as Action } from "@/lib/today";

const LABELS: Record<Action["kind"], string> = {
  start: "Period started today?",
  end: "Period ended today?",
};

// One tap saves; the toast that follows offers Undo. 44px tall, secondary style.
export function PeriodQuickAction({ action, onTap }: { action: Action; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-pill bg-surface-2 px-4 text-body-strong text-ink transition-colors hover:bg-line"
    >
      <IconDroplet size={20} stroke={1.75} aria-hidden className="text-period" />
      {LABELS[action.kind]}
    </button>
  );
}
