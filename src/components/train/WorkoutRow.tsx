import { IconTrash } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { PHASE_NAMES } from "@/components/today/todayConfig";
import { IconButton } from "@/components/ui/IconButton";
import type { Workout } from "@/db/schema";
import type { Phase } from "@/lib/cycle";
import { cx } from "@/lib/cx";
import { workoutTypeInfo } from "./workoutConfig";

const PHASE_DOTS: Record<Phase, string> = {
  menstrual: "bg-phase-menstrual",
  follicular: "bg-phase-follicular",
  ovulatory: "bg-phase-ovulatory",
  luteal: "bg-phase-luteal",
};

interface WorkoutRowProps {
  workout: Workout;
  phase: Phase | null;
  onDelete: () => void;
}

// Compact row: the phase dot always comes with the phase name, so color is not the only signal.
export function WorkoutRow({ workout, phase, onDelete }: WorkoutRowProps) {
  const { label, icon: TypeIcon } = workoutTypeInfo(workout.type);
  const dateLabel = format(parseISO(workout.date), "EEE, MMM d");
  return (
    <li className="flex items-center gap-3 rounded-input bg-surface py-2 pr-1 pl-3 shadow-card">
      <TypeIcon size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-strong text-ink">
          {label}, {workout.durationMin} min, effort {workout.rpe}
        </p>
        <p className="flex items-center gap-1.5 text-small text-ink-muted">
          {dateLabel}
          {phase && (
            <>
              <span aria-hidden className={cx("size-2 rounded-pill", PHASE_DOTS[phase])} />
              {PHASE_NAMES[phase]}
            </>
          )}
        </p>
      </div>
      <IconButton icon={IconTrash} aria-label={`Delete ${label} workout from ${dateLabel}`} onClick={onDelete} />
    </li>
  );
}
