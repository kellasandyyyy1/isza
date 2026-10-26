import { Chip } from "@/components/ui/Chip";
import { GOAL_OPTIONS, toggleGoal } from "./onboardingOptions";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

export function GoalsStep({ answers, onChange, headingId }: StepProps) {
  return (
    <>
      <StepHeading id={headingId} title="What brings you to Isza?" subtitle="Pick one or more." />
      <div role="group" aria-labelledby={headingId} className="flex flex-wrap gap-2">
        {GOAL_OPTIONS.map(({ value, label, icon }) => (
          <Chip
            key={value}
            icon={icon}
            selected={answers.goals.includes(value)}
            onClick={() => onChange({ goals: toggleGoal(answers.goals, value) })}
          >
            {label}
          </Chip>
        ))}
      </div>
    </>
  );
}
