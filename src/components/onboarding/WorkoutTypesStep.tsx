import { Chip } from "@/components/ui/Chip";
import type { WorkoutType } from "@/db/schema";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

const OPTIONS: { value: WorkoutType; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "hiit", label: "HIIT" },
  { value: "cardio", label: "Cardio" },
  { value: "mobility", label: "Mobility" },
  { value: "sport", label: "Sport" },
];

export function WorkoutTypesStep({ answers, onChange, headingId }: StepProps) {
  function toggle(type: WorkoutType) {
    const selected = answers.workoutTypes.includes(type);
    const next = OPTIONS.map((option) => option.value).filter((value) =>
      value === type ? !selected : answers.workoutTypes.includes(value),
    );
    onChange({ workoutTypes: next });
  }

  return (
    <>
      <StepHeading id={headingId} title="What do you like to do?" subtitle="Optional. Pick any that fit." />
      <div role="group" aria-labelledby={headingId} className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label }) => (
          <Chip key={value} selected={answers.workoutTypes.includes(value)} onClick={() => toggle(value)}>
            {label}
          </Chip>
        ))}
      </div>
    </>
  );
}
