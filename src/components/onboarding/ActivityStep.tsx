import { ACTIVITY_OPTIONS } from "./onboardingOptions";
import { RadioCardGroup } from "./RadioCardGroup";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

export function ActivityStep({ answers, onChange, headingId }: StepProps) {
  return (
    <>
      <StepHeading id={headingId} title="How active are you?" subtitle="Think about a usual week." />
      <RadioCardGroup
        name="activity"
        labelledBy={headingId}
        options={ACTIVITY_OPTIONS}
        value={answers.activityLevel}
        onChange={(activityLevel) => onChange({ activityLevel })}
      />
    </>
  );
}
