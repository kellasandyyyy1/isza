"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { format } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
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
  type OnboardingStep,
} from "@/lib/onboarding";
import { ActivityStep } from "./ActivityStep";
import { ContraceptionStep } from "./ContraceptionStep";
import { GoalsStep } from "./GoalsStep";
import { LastPeriodStep } from "./LastPeriodStep";
import { LengthStep } from "./LengthStep";
import { NameStep } from "./NameStep";
import { PrivacyStep } from "./PrivacyStep";
import { WelcomeStep } from "./WelcomeStep";
import { WorkoutTypesStep } from "./WorkoutTypesStep";

const todayIso = () => format(new Date(), "yyyy-MM-dd");

// The short label over each question, so she always knows which part she is in.
const SECTIONS: Record<OnboardingStep, string> = {
  welcome: "",
  name: "About you",
  goals: "About you",
  "last-period": "Your cycle",
  "cycle-length": "Your cycle",
  "period-length": "Your cycle",
  contraception: "Your cycle",
  activity: "Your training",
  workouts: "Your training",
  privacy: "Almost done",
};

// One question per screen. Back sits at the top left with the progress; the one primary button sits at the
// bottom, in thumb reach. Answers stay in state and are saved only on the last screen.
export function OnboardingFlow() {
  const router = useRouter();
  const headingId = useId();
  const reduced = useReducedMotion() === true;
  const [stepIndex, setStepIndex] = useState(0);
  // 1 going forward, -1 going back: each screen slides in from the side she is heading to.
  const [direction, setDirection] = useState<1 | -1>(1);
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
    setDirection(index > stepIndex ? 1 : -1);
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
      case "name":
        return (
          <NameStep
            {...props}
            onSkip={() => {
              setAnswers((a) => ({ ...a, name: "" }));
              goTo(stepIndex + 1);
            }}
          />
        );
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
      {/* The welcome screen is the hero alone: no progress yet. */}
      {isFirst ? (
        <div />
      ) : (
        <header className="mx-auto w-full max-w-md px-2 pt-2">
          <div className="flex items-center gap-2">
            <IconButton icon={IconChevronLeft} aria-label="Back" disabled={saving} onClick={() => goTo(stepIndex - 1)} />
            <StepDots total={ONBOARDING_STEPS.length} step={stepIndex + 1} />
          </div>
          <p className="flex justify-between px-2 pt-2 text-caption text-ink-muted">
            <span>{SECTIONS[step]}</span>
            <span>
              {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
          </p>
        </header>
      )}

      <main className="mx-auto w-full max-w-md overflow-x-hidden overflow-y-auto px-4 pt-4">
        <motion.div
          key={step}
          className="h-full"
          initial={reduced ? false : { opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderStep()}
        </motion.div>
      </main>

      <div className="mx-auto w-full max-w-md px-4 pt-3 pb-4">
        {saveFailed && (
          <p role="alert" className="mb-2 text-center text-small text-danger">
            Something went wrong while saving. Please try again.
          </p>
        )}
        <Button
          fullWidth
          disabled={!isFirst && !ready}
          loading={saving}
          onClick={() => (isLast ? void finish() : goTo(stepIndex + 1))}
        >
          {isFirst ? "Get started" : isLast ? "Start using Iszacycle" : "Next"}
        </Button>
      </div>
    </div>
  );
}
