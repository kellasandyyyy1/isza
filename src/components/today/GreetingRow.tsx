import type { ReactNode } from "react";

// The page heading on Today: the greeting, with the date under it, and the header's one optional action.
export function GreetingRow({ greeting, dateLabel, action }: { greeting: string; dateLabel: string; action?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-h1 text-ink">{greeting}</h1>
        <p className="text-small text-ink-muted">{dateLabel}</p>
      </div>
      {action}
    </div>
  );
}
