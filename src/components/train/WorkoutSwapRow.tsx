import { Chip } from "@/components/ui/Chip";
import type { PlanWorkoutType } from "@/content/training";
import { WORKOUT_TYPES } from "./workoutConfig";

const SWAP_TYPES = WORKOUT_TYPES.filter(
  (item): item is (typeof WORKOUT_TYPES)[number] & { value: PlanWorkoutType } => item.value !== "sport",
);

interface WorkoutSwapRowProps {
  chosen: PlanWorkoutType | null;
  onChoose: (type: PlanWorkoutType) => void;
}

// One row. It scrolls sideways on narrow phones instead of wrapping.
export function WorkoutSwapRow({ chosen, onChoose }: WorkoutSwapRowProps) {
  return (
    <div
      role="group"
      aria-label="Swap workout"
      className="-mx-4 flex shrink-0 snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
    >
      {SWAP_TYPES.map(({ value, label, icon }) => (
        <Chip key={value} icon={icon} selected={chosen === value} onClick={() => onChoose(value)} className="shrink-0 snap-start">
          {label}
        </Chip>
      ))}
    </div>
  );
}
