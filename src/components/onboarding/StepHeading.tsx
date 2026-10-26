// tabIndex -1 lets the flow move focus here when the step changes.
export function StepHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 id={id} tabIndex={-1} className="text-h1 text-ink focus:outline-none">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-body text-ink-muted">{subtitle}</p>}
    </div>
  );
}
