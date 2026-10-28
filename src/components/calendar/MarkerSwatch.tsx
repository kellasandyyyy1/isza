import { cx } from "@/lib/cx";

export type MarkerKind = "logged" | "predicted" | "fertile" | "check-in" | "today";

// Small sample of a day marker, for the legend. Each marker has its own shape, not only a color.
export function MarkerSwatch({ kind }: { kind: MarkerKind }) {
  return (
    <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
      <span
        className={cx(
          "rounded-pill",
          kind === "logged" && "size-3.5 bg-period",
          kind === "predicted" && "size-3.5 border-2 border-dashed border-period",
          kind === "fertile" && "h-3 w-4 bg-fertile-band",
          kind === "check-in" && "size-1 bg-ink-muted",
          kind === "today" && "size-3.5 ring-2 ring-ink",
        )}
      />
    </span>
  );
}
