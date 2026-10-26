// The page heading on Today: the greeting, with the date under it.
export function GreetingRow({ greeting, dateLabel }: { greeting: string; dateLabel: string }) {
  return (
    <div className="shrink-0">
      <h1 className="truncate text-h1 text-ink">{greeting}</h1>
      <p className="text-small text-ink-muted">{dateLabel}</p>
    </div>
  );
}
