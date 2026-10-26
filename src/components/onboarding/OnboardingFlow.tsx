"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StepDots } from "@/components/ui/StepDots";
import { completeOnboarding } from "@/db/repo";
import {
  CYCLE_LENGTH_RANGE,
  ONBOARDING_STEPS,
  PERIOD_LENGTH_RANGE,
  buildOnboardingRecords,
  canContinue,
  initialOnboardingAnswers,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import { ActivityStep } from "./ActivityStep";
import { ContraceptionStep } from "./ContraceptionStep";
import { GoalsStep } from "./GoalsStep";
import { LastPeriodStep } from "./LastPeriodStep";
import { LengthStep } from "./LengthStep";
import { PrivacyStep } from "./PrivacyStep";
import { WelcomeStep } from "./WelcomeStep";
import { WorkoutTypesStep } from "./WorkoutTypesStep";

const todayIso = () => format(new Date(), "yyyy-MM-dd");

// One question per screen. Answers stay in state and are saved only on the last screen.
export function OnboardingFlow() {
  const router = useRouter();
  const headingId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialOnboardingAnswers);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const movedRef = useRef(false);

  const step = ONBOARDING_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const props = { answers, headingId, onChange: (patch: Partial<OnboardingAnswers>) => setAnswers((a) => ({ ...a, ...patch })) };

  // Move focus to the new heading so screen readers announce each question.
  useEffect(() => {
    if (!movedRef.current) return;
    document.getElementById(headingId)?.focus();
  }, [stepIndex, headingId]);

  function goTo(index: number) {
    movedRef.current = true;
    setStepIndex(index);
  }

  async function finish() {
    setSaving(true);
    setSaveFailed(false);
    try {
      const { profile, period } = buildOnboardingRecords(answers, todayIso(), new Date().toISOString());
      await completeOnboarding(profile, period);
      router.replace("/today");
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  }

  function renderStep() {
    switch (step) {
      case "welcome":
        return <WelcomeStep headingId={headingId} />;
      case "goals":
        return <GoalsStep {...props} />;
      case "last-period":
        return (
          <LastPeriodStep
            {...props}
            today={todayIso()}
            onSkip={() => {
              setAnswers((a) => ({ ...a, lastPeriodStart: null }));
              goTo(stepIndex + 1);
            }}
          />
        );
      case "cycle-length":
        return (
          <LengthStep
            headingId={headingId}
            title="How long is your usual cycle?"
            subtitle="From the first day of one period to the next."
            range={CYCLE_LENGTH_RANGE}
            value={answers.cycleLength}
            unsure={answers.cycleLengthUnsure}
            onChange={({ value, unsure }) => props.onChange({ cycleLength: value, cycleLengthUnsure: unsure })}
          />
        );
      case "period-length":
        return (
          <LengthStep
            headingId={headingId}
            title="How long does your period last?"
            subtitle="Count the days you usually bleed."
            range={PERIOD_LENGTH_RANGE}
            value={answers.periodLength}
            unsure={answers.periodLengthUnsure}
            onChange={({ value, unsure }) => props.onChange({ periodLength: value, periodLengthUnsure: unsure })}
          />
        );
      case "contraception":
        return <ContraceptionStep {...props} />;
      case "activity":
        return <ActivityStep {...props} />;
      case "workouts":
        return <WorkoutTypesStep {...props} />;
      case "privacy":
        return <PrivacyStep {...props} />;
    }
  }

  const ready = canContinue(step, answers);

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      <div className="mx-auto w-full max-w-md px-4 pt-4">
        <StepDots total={ONBOARDING_STEPS.length} step={stepIndex + 1} />
      </div>

      <main className="mx-auto w-full max-w-md overflow-y-auto px-4 pt-6">{renderStep()}</main>

      <div className="mx-auto w-full max-w-md px-4 pt-3 pb-4">
        {saveFailed && (
          <p role="alert" className="mb-2 text-center text-small text-danger">
            Something went wrong while saving. Please try again.
          </p>
        )}
        {isFirst ? (
          <Button fullWidth onClick={() => goTo(1)}>
            Get started
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="ghost" disabled={saving} onClick={() => goTo(stepIndex - 1)}>
              Back
            </Button>
            <Button
              fullWidth
              disabled={!ready}
              loading={saving}
              onClick={() => (isLast ? void finish() : goTo(stepIndex + 1))}
            >
              {isLast ? "Start using Isza" : "Next"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
