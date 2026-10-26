import { Card } from "@/components/ui/Card";
import type { Workout } from "@/db/schema";
import { FEEL_OPTIONS, workoutTypeInfo } from "./workoutConfig";

// Today's logged workout on the Today tab.
export function WorkoutCard({ workout }: { workout: Workout }) {
  const { label, icon: TypeIcon } = workoutTypeInfo(workout.type);
  const feel = FEEL_OPTIONS.find((option) => option.value === workout.feel)?.label;
  return (
    <Card className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-ink">
        <TypeIcon size={20} stroke={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-body-strong text-ink">{label}</p>
        <p className="text-small text-ink-muted">
          {workout.durationMin} min, effort {workout.rpe} of 10, felt {feel?.toLowerCase()}
        </p>
      </div>
    </Card>
  );
}
