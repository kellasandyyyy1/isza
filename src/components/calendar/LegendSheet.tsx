import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { MarkerSwatch, type MarkerKind } from "./MarkerSwatch";

const ENTRIES: { kind: MarkerKind; title: string; text: string }[] = [
  { kind: "logged", title: "Period", text: "Filled circle: days you logged as your period." },
  { kind: "predicted", title: "Predicted period", text: "Dashed circle: when your next period may come." },
  { kind: "fertile", title: "Fertile window", text: "Estimated only. Not for birth control." },
  { kind: "check-in", title: "Check-in", text: "Small dot under the date: you logged a check-in." },
  { kind: "today", title: "Today", text: "Ring around the date." },
];

export function LegendSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Calendar markers">
      <ul className="flex flex-col gap-4">
        {ENTRIES.map(({ kind, title, text }) => (
          <li key={kind} className="flex gap-3">
            <span className="mt-0.5">
              <MarkerSwatch kind={kind} />
            </span>
            <span>
              <span className="block text-body-strong text-ink">{title}</span>
              <span className="block text-body text-ink-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </ResponsiveSheet>
  );
}
