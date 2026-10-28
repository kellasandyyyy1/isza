import { IconAlertTriangle } from "@tabler/icons-react";

// Development only: both legal pages are drafts until a lawyer has reviewed them. Production builds render nothing.
export function DraftNotice() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <p role="note" className="flex items-start gap-2 rounded-input bg-surface-2 p-3 text-small text-ink">
      <IconAlertTriangle size={20} stroke={1.75} aria-hidden className="shrink-0 text-warning" />
      Draft for legal review. This note shows in development only.
    </p>
  );
}
