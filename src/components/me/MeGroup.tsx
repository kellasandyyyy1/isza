import { useId, type ReactNode } from "react";

export function MeGroup({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
      <h2 id={headingId} className="px-3 text-caption tracking-wide text-ink-muted uppercase">
        {title}
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-edge bg-surface shadow-card">
        {children}
      </ul>
    </section>
  );
}
