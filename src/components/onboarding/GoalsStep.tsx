import { GOAL_OPTIONS, toggleGoal } from "./onboardingOptions";
import { OptionTile } from "./OptionTile";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

export function GoalsStep({ answers, onChange, headingId }: StepProps) {
  return (
    <>
      <StepHeading id={headingId} title="What brings you to Iszacycle?" subtitle="Pick one or more." />
      <div role="group" aria-labelledby={headingId} className="grid grid-cols-2 gap-3">
        {GOAL_OPTIONS.map(({ value, label, icon }) => (
          <OptionTile
            key={value}
            label={label}
            icon={icon}
            selected={answers.goals.includes(value)}
            onToggle={() => onChange({ goals: toggleGoal(answers.goals, value) })}
          />
        ))}
      </div>
    </>
  );
}
