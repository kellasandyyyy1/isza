import { IconCheck, type Icon } from "@tabler/icons-react";
import { SELECTED_CLASSES, UNSELECTED_CLASSES } from "@/components/ui/selection";
import { cx } from "@/lib/cx";

interface OptionTileProps {
  label: string;
  icon: Icon;
  selected: boolean;
  onToggle: () => void;
}

// A large multi-select tile for onboarding: the icon on top, the label under it. When selected, a check badge
// shows in the corner and the label turns bold, so the state is not shown by color alone.
export function OptionTile({ label, icon: TileIcon, selected, onToggle }: OptionTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cx(
        "relative flex min-h-22 flex-col items-start justify-between gap-2 rounded-input p-3 text-left text-small transition-colors",
        selected ? SELECTED_CLASSES : UNSELECTED_CLASSES,
      )}
    >
      <span aria-hidden className="flex size-9 items-center justify-center rounded-pill bg-surface-2 text-ink">
        <TileIcon size={20} stroke={1.75} />
      </span>
      <span className="leading-tight">{label}</span>
      {selected && (
        <span
          aria-hidden
          className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-pill bg-ink text-surface"
        >
          <IconCheck size={14} stroke={2.5} />
        </span>
      )}
    </button>
  );
}
