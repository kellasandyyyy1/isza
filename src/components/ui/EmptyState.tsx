import type { Icon } from "@tabler/icons-react";
import { Button } from "./Button";
import { MascotSlot, type MascotPose, type MascotSize } from "./MascotSlot";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: Icon;
}

export interface EmptyStateProps {
  icon: Icon;
  title: string;
  text: string;
  action?: EmptyStateAction;
  // The pose of the page it is on. Shown instead of the icon, size md unless set.
  mascot?: { pose: MascotPose; size?: MascotSize };
}

export function EmptyState({ icon: StateIcon, title, text, action, mascot }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      {mascot ? (
        <MascotSlot pose={mascot.pose} size={mascot.size ?? "md"} />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-pill bg-surface-2 text-ink">
          <StateIcon size={28} stroke={1.75} aria-hidden />
        </span>
      )}
      <h2 className="text-h2 text-ink">{title}</h2>
      <p className="max-w-xs text-body text-ink-muted">{text}</p>
      {action && (
        <Button icon={action.icon} onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
