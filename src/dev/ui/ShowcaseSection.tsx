import type { ReactNode } from "react";

export function ShowcaseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-caption tracking-wide text-ink-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}
