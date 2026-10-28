import { IconBallBasketball, IconBarbell, IconFlame, IconRun, IconStretching, type Icon } from "@tabler/icons-react";
import type { WorkoutType } from "@/db/schema";
import { OptionTile } from "./OptionTile";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

const OPTIONS: { value: WorkoutType; label: string; icon: Icon }[] = [
  { value: "strength", label: "Strength", icon: IconBarbell },
  { value: "hiit", label: "HIIT", icon: IconFlame },
  { value: "cardio", label: "Cardio", icon: IconRun },
  { value: "mobility", label: "Mobility", icon: IconStretching },
  { value: "sport", label: "Sport", icon: IconBallBasketball },
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
      <div role="group" aria-labelledby={headingId} className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ value, label, icon }) => (
          <OptionTile
            key={value}
            label={label}
            icon={icon}
            selected={answers.workoutTypes.includes(value)}
            onToggle={() => toggle(value)}
          />
        ))}
      </div>
    </>
  );
}
