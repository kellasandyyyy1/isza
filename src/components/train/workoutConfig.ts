import {
  IconBallFootball,
  IconBarbell,
  IconBed,
  IconFlame,
  IconRun,
  IconStretching,
  type Icon,
} from "@tabler/icons-react";
import type { Workout, WorkoutType } from "@/db/schema";

export const WORKOUT_TYPES: { value: WorkoutType; label: string; icon: Icon }[] = [
  { value: "strength", label: "Strength", icon: IconBarbell },
  { value: "hiit", label: "HIIT", icon: IconFlame },
  { value: "cardio", label: "Cardio", icon: IconRun },
  { value: "mobility", label: "Mobility", icon: IconStretching },
  { value: "sport", label: "Sport", icon: IconBallFootball },
  { value: "rest", label: "Rest", icon: IconBed },
];

export const FEEL_OPTIONS: { value: Workout["feel"]; label: string }[] = [
  { value: "strong", label: "Strong" },
  { value: "normal", label: "Normal" },
  { value: "weak", label: "Weak" },
];

export function workoutTypeInfo(type: WorkoutType) {
  return WORKOUT_TYPES.find((item) => item.value === type) ?? WORKOUT_TYPES[0];
}
