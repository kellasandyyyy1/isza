import { ArtIcon } from "@/components/ui/ArtIcon";

// One line, so the Today screen still fits without scrolling.
export function PeriodPrepCard({ text }: { text: string }) {
  return (
    <p className="flex min-h-11 w-full shrink-0 items-center gap-2 rounded-pill bg-period-tint pr-4 pl-2 text-small text-ink">
      <ArtIcon name="period" size="sm" />
      <span className="min-w-0 flex-1">{text}</span>
    </p>
  );
}
