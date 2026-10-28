import type { Workout } from "@/db/schema";
import { relativeDay } from "@/lib/training";
import { FEEL_OPTIONS, workoutTypeInfo } from "./workoutConfig";

// Hidden on screens under 700px tall, so the Plan tab fits without scrolling.
const FIT = "[@media(max-height:699px)]:hidden";

export function LastSessionRow({ workout, today }: { workout: Workout | null; today: string }) {
  if (!workout) return <p className={`shrink-0 text-small text-ink-muted ${FIT}`}>No workouts yet</p>;

  const { label, icon: TypeIcon } = workoutTypeInfo(workout.type);
  const feel = FEEL_OPTIONS.find((option) => option.value === workout.feel)?.label;
  return (
    <section aria-label="Last session" className={`flex shrink-0 items-center gap-3 ${FIT}`}>
      <TypeIcon size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink" />
      <p className="min-w-0 flex-1 truncate text-small text-ink">
        <span className="text-body-strong">{label}</span>, {workout.durationMin} min, effort {workout.rpe},{" "}
        {relativeDay(workout.date, today)}
      </p>
      {feel && (
        <span className="shrink-0 rounded-pill bg-surface-2 px-3 py-1 text-caption text-ink">Felt {feel.toLowerCase()}</span>
      )}
    </section>
  );
}
