import { IconInfoCircle } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import type { LegendMarker } from "@/lib/calendar";
import { MarkerSwatch } from "./MarkerSwatch";

const LABELS: Record<LegendMarker, string> = {
  logged: "Period",
  predicted: "Predicted",
  fertile: "Fertile (estimate)",
  "check-in": "Check-in",
};

// Only the markers on the days in the grid, in a fixed order. Chips wrap to a second line when needed.
// Under 1024px it always keeps room for two lines of chips, so the grid above keeps its height in every month.
// Under 700px tall it hides to give the grid its 44px rows; the month header's info button opens the same sheet.
export function CalendarLegend({ markers, onExplain }: { markers: LegendMarker[]; onExplain: () => void }) {
  return (
    <div className="flex min-h-14.5 shrink-0 items-center justify-between gap-2 lg:min-h-0 [@media(max-height:699px)]:hidden">
      <ul data-legend className="flex min-w-0 flex-wrap items-center gap-1.5">
        {markers.map((kind) => (
          <li key={kind} className="flex items-center gap-1 rounded-pill bg-surface-2 py-1 pr-2.5 pl-1.5 text-caption text-ink">
            <MarkerSwatch kind={kind} />
            {LABELS[kind]}
          </li>
        ))}
      </ul>
      <IconButton icon={IconInfoCircle} aria-label="What do these mean?" onClick={onExplain} className="ml-auto" />
    </div>
  );
}
