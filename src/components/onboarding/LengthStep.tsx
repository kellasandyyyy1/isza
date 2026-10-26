import { Chip } from "@/components/ui/Chip";
import { LengthStepper } from "./LengthStepper";
import { StepHeading } from "./StepHeading";

interface LengthStepProps {
  headingId: string;
  title: string;
  subtitle: string;
  range: { min: number; max: number };
  value: number;
  unsure: boolean;
  onChange: (change: { value: number; unsure: boolean }) => void;
}

// Shared by the cycle length and period length steps.
export function LengthStep({ headingId, title, subtitle, range, value, unsure, onChange }: LengthStepProps) {
  return (
    <>
      <StepHeading id={headingId} title={title} subtitle={subtitle} />
      <LengthStepper
        value={value}
        min={range.min}
        max={range.max}
        disabled={unsure}
        labelledBy={headingId}
        onChange={(next) => onChange({ value: next, unsure: false })}
      />
      <div className="mt-8 flex justify-center">
        <Chip selected={unsure} onClick={() => onChange({ value, unsure: !unsure })}>
          Not sure
        </Chip>
      </div>
    </>
  );
}
