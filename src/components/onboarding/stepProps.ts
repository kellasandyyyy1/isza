import type { OnboardingAnswers } from "@/lib/onboarding";

export interface StepProps {
  answers: OnboardingAnswers;
  onChange: (patch: Partial<OnboardingAnswers>) => void;
  // Id of the step's h1, for labelling its controls.
  headingId: string;
}
