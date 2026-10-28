import { CONTRACEPTION_OPTIONS } from "./onboardingOptions";
import { RadioCardGroup } from "./RadioCardGroup";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

export function ContraceptionStep({ answers, onChange, headingId }: StepProps) {
  return (
    <>
      <StepHeading id={headingId} title="Do you use contraception?" subtitle="This changes what Iszacycle can predict." />
      <RadioCardGroup
        name="contraception"
        labelledBy={headingId}
        options={CONTRACEPTION_OPTIONS}
        value={answers.contraception}
        onChange={(contraception) => onChange({ contraception })}
      />
    </>
  );
}
