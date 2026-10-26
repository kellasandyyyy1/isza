import { z } from "zod";
import {
  contraceptionSchema,
  goalSchema,
  isoDateSchema,
  profileSchema,
  workoutTypeSchema,
  type Period,
  type Profile,
} from "@/db/schema";
import { shiftDate } from "./cycle";

export function homeRouteFor(onboardingComplete: boolean): "/today" | "/onboarding" {
  return onboardingComplete ? "/today" : "/onboarding";
}

export const ONBOARDING_STEPS = [
  "welcome",
  "goals",
  "last-period",
  "cycle-length",
  "period-length",
  "contraception",
  "activity",
  "workouts",
  "privacy",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const CYCLE_LENGTH_RANGE = { min: 21, max: 45, initial: 28 } as const;
export const PERIOD_LENGTH_RANGE = { min: 2, max: 10, initial: 5 } as const;
// Used for the first period's end date when the period length is "Not sure".
const FALLBACK_PERIOD_LENGTH = 5;
// The calendar offers today and the 59 days before it.
export const LAST_PERIOD_WINDOW_DAYS = 60;

// Answers live in component state until the last screen. Lengths keep their stepper value
// while "Not sure" is on, so turning it off restores the number.
export const onboardingAnswersSchema = z.object({
  goals: z.array(goalSchema),
  lastPeriodStart: isoDateSchema.nullable(),
  cycleLength: z.number().int().min(CYCLE_LENGTH_RANGE.min).max(CYCLE_LENGTH_RANGE.max),
  cycleLengthUnsure: z.boolean(),
  periodLength: z.number().int().min(PERIOD_LENGTH_RANGE.min).max(PERIOD_LENGTH_RANGE.max),
  periodLengthUnsure: z.boolean(),
  contraception: contraceptionSchema.nullable(),
  activityLevel: profileSchema.shape.activityLevel.nullable(),
  workoutTypes: z.array(workoutTypeSchema),
  privacyAccepted: z.boolean(),
});
export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const initialOnboardingAnswers: OnboardingAnswers = {
  goals: [],
  lastPeriodStart: null,
  cycleLength: CYCLE_LENGTH_RANGE.initial,
  cycleLengthUnsure: false,
  periodLength: PERIOD_LENGTH_RANGE.initial,
  periodLengthUnsure: false,
  contraception: null,
  activityLevel: null,
  workoutTypes: [],
  privacyAccepted: false,
};

// Whether the forward button is enabled on a step.
export function canContinue(step: OnboardingStep, answers: OnboardingAnswers): boolean {
  switch (step) {
    case "goals":
      return answers.goals.length >= 1;
    case "last-period":
      return answers.lastPeriodStart !== null;
    case "contraception":
      return answers.contraception !== null;
    case "activity":
      return answers.activityLevel !== null;
    case "privacy":
      return answers.privacyAccepted;
    default:
      return true;
  }
}

export function isLastPeriodSelectable(date: string, today: string): boolean {
  return date <= today && date > shiftDate(today, -LAST_PERIOD_WINDOW_DAYS);
}

export interface OnboardingRecords {
  profile: Profile;
  period: Omit<Period, "id"> | null;
}

// Turns finished answers into the records to save. Throws if a required answer is missing.
export function buildOnboardingRecords(
  answers: OnboardingAnswers,
  today: string,
  createdAt: string,
): OnboardingRecords {
  const valid = onboardingAnswersSchema.parse(answers);
  for (const step of ONBOARDING_STEPS) {
    if (step !== "last-period" && !canContinue(step, valid)) throw new Error(`Onboarding step "${step}" is not answered.`);
  }
  if (valid.contraception === null || valid.activityLevel === null) throw new Error("Onboarding is not answered.");

  const periodLength = valid.periodLengthUnsure ? null : valid.periodLength;
  const profile: Profile = {
    id: "me",
    name: null,
    goals: valid.goals,
    contraception: valid.contraception,
    typicalCycleLength: valid.cycleLengthUnsure ? null : valid.cycleLength,
    typicalPeriodLength: periodLength,
    activityLevel: valid.activityLevel,
    workoutTypes: valid.workoutTypes,
    onboardingComplete: true,
    discreetMode: false,
    createdAt,
  };

  const start = valid.lastPeriodStart;
  return { profile, period: start === null ? null : periodFromStart(start, today, periodLength) };
}

// A period logged by its start date. It ends after the period length (5 days when unknown)
// if that day has come; otherwise it is still going and stays open.
export function periodFromStart(startDate: string, today: string, periodLength: number | null): Omit<Period, "id"> {
  const usualEnd = shiftDate(startDate, (periodLength ?? FALLBACK_PERIOD_LENGTH) - 1);
  return { startDate, endDate: usualEnd <= today ? usualEnd : null };
}
