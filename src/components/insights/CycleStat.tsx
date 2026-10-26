export function CycleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input bg-surface px-3 py-2.5 shadow-card">
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd className="text-body-strong text-ink">{value}</dd>
    </div>
  );
}
