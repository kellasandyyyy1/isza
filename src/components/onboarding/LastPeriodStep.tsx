import { Button } from "@/components/ui/Button";
import { LastPeriodCalendar } from "./LastPeriodCalendar";
import { StepHeading } from "./StepHeading";
import type { StepProps } from "./stepProps";

interface LastPeriodStepProps extends StepProps {
  today: string;
  onSkip: () => void;
}

export function LastPeriodStep({ answers, onChange, headingId, today, onSkip }: LastPeriodStepProps) {
  return (
    <>
      <StepHeading id={headingId} title="When did your last period start?" subtitle="Tap the first day of bleeding." />
      <LastPeriodCalendar
        value={answers.lastPeriodStart}
        onChange={(date) => onChange({ lastPeriodStart: date })}
        today={today}
        labelledBy={headingId}
      />
      <div className="mt-3 flex justify-center">
        <Button variant="secondary" size="sm" onClick={onSkip}>
          I don&apos;t remember
        </Button>
      </div>
    </>
  );
}
