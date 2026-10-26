import { IconInfoCircle } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import { MarkerSwatch, type MarkerKind } from "./MarkerSwatch";

const ITEMS: { kind: MarkerKind; label: string }[] = [
  { kind: "logged", label: "Period" },
  { kind: "predicted", label: "Due" },
  { kind: "fertile", label: "Fertile" },
  { kind: "check-in", label: "Check-in" },
];

// One line. The fertile marker only appears in standard mode, so its legend item follows it.
export function CalendarLegend({ showFertile, onExplain }: { showFertile: boolean; onExplain: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-1">
      <ul data-legend className="flex min-w-0 items-center gap-1.5 overflow-hidden text-caption text-ink-muted">
        {ITEMS.filter((item) => showFertile || item.kind !== "fertile").map(({ kind, label }) => (
          <li key={kind} className="flex shrink-0 items-center gap-0.5">
            <MarkerSwatch kind={kind} />
            {label}
          </li>
        ))}
      </ul>
      <IconButton icon={IconInfoCircle} aria-label="What the markers mean" onClick={onExplain} />
    </div>
  );
}
