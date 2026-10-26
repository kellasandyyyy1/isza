import { describe, expect, it } from "vitest";
import {
  buildOnboardingRecords,
  canContinue,
  homeRouteFor,
  initialOnboardingAnswers,
  isLastPeriodSelectable,
  type OnboardingAnswers,
} from "./onboarding";

const TODAY = "2026-10-25";
const CREATED_AT = "2026-10-25T08:00:00.000Z";

const complete: OnboardingAnswers = {
  ...initialOnboardingAnswers,
  goals: ["train", "energy"],
  lastPeriodStart: "2026-10-10",
  contraception: "none",
  activityLevel: "moderate",
  workoutTypes: ["strength"],
  privacyAccepted: true,
};

describe("homeRouteFor", () => {
  it("sends new users to onboarding and returning users to today", () => {
    expect(homeRouteFor(false)).toBe("/onboarding");
    expect(homeRouteFor(true)).toBe("/today");
  });
});

describe("canContinue", () => {
  it("requires at least one goal", () => {
    expect(canContinue("goals", initialOnboardingAnswers)).toBe(false);
    expect(canContinue("goals", { ...initialOnboardingAnswers, goals: ["symptoms"] })).toBe(true);
  });

  it("requires a date, contraception, activity level and the privacy checkbox", () => {
    expect(canContinue("last-period", initialOnboardingAnswers)).toBe(false);
    expect(canContinue("contraception", initialOnboardingAnswers)).toBe(false);
    expect(canContinue("activity", initialOnboardingAnswers)).toBe(false);
    expect(canContinue("privacy", initialOnboardingAnswers)).toBe(false);
    for (const step of ["last-period", "contraception", "activity", "privacy"] as const) {
      expect(canContinue(step, complete)).toBe(true);
    }
  });

  it("never blocks the welcome, length and workout steps", () => {
    for (const step of ["welcome", "cycle-length", "period-length", "workouts"] as const) {
      expect(canContinue(step, initialOnboardingAnswers)).toBe(true);
    }
  });
});

describe("isLastPeriodSelectable", () => {
  it("allows today and the 59 days before it", () => {
    expect(isLastPeriodSelectable(TODAY, TODAY)).toBe(true);
    expect(isLastPeriodSelectable("2026-08-27", TODAY)).toBe(true);
    expect(isLastPeriodSelectable("2026-08-26", TODAY)).toBe(false);
    expect(isLastPeriodSelectable("2026-10-26", TODAY)).toBe(false);
  });
});

describe("buildOnboardingRecords", () => {
  it("builds a complete profile", () => {
    expect(buildOnboardingRecords(complete, TODAY, CREATED_AT).profile).toEqual({
      id: "me",
      name: null,
      goals: ["train", "energy"],
      contraception: "none",
      typicalCycleLength: 28,
      typicalPeriodLength: 5,
      activityLevel: "moderate",
      workoutTypes: ["strength"],
      onboardingComplete: true,
      discreetMode: false,
      createdAt: CREATED_AT,
    });
  });

  it("saves null for lengths marked not sure", () => {
    const { profile } = buildOnboardingRecords(
      { ...complete, cycleLengthUnsure: true, periodLengthUnsure: true },
      TODAY,
      CREATED_AT,
    );
    expect(profile).toMatchObject({ typicalCycleLength: null, typicalPeriodLength: null });
  });

  it("ends a past period after the period length", () => {
    const answers = { ...complete, periodLength: 4 };
    expect(buildOnboardingRecords(answers, TODAY, CREATED_AT).period).toEqual({
      startDate: "2026-10-10",
      endDate: "2026-10-13",
    });
  });

  it("uses 5 days for the end date when period length is not sure", () => {
    const answers = { ...complete, periodLengthUnsure: true };
    expect(buildOnboardingRecords(answers, TODAY, CREATED_AT).period?.endDate).toBe("2026-10-14");
  });

  it("leaves a recent period open until its usual length has passed", () => {
    const answers = { ...complete, lastPeriodStart: "2026-10-23", periodLength: 5 };
    expect(buildOnboardingRecords(answers, TODAY, CREATED_AT).period).toEqual({ startDate: "2026-10-23", endDate: null });
    const endsToday = { ...complete, lastPeriodStart: "2026-10-21", periodLength: 5 };
    expect(buildOnboardingRecords(endsToday, TODAY, CREATED_AT).period?.endDate).toBe(TODAY);
  });

  it("leaves a period that started today open", () => {
    const answers = { ...complete, lastPeriodStart: TODAY };
    expect(buildOnboardingRecords(answers, TODAY, CREATED_AT).period).toEqual({ startDate: TODAY, endDate: null });
  });

  it("adds no period when the date was skipped", () => {
    const answers = { ...complete, lastPeriodStart: null };
    expect(buildOnboardingRecords(answers, TODAY, CREATED_AT).period).toBeNull();
  });

  it("throws when a required answer is missing", () => {
    expect(() => buildOnboardingRecords({ ...complete, goals: [] }, TODAY, CREATED_AT)).toThrow(/goals/);
    expect(() => buildOnboardingRecords({ ...complete, privacyAccepted: false }, TODAY, CREATED_AT)).toThrow(
      /privacy/,
    );
  });
});
