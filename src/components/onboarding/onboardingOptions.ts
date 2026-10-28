import { IconBarbell, IconBolt, IconCalendarStats, IconNotes, type Icon } from "@tabler/icons-react";
import type { Contraception, Goal, Profile } from "@/db/schema";
import type { RadioCardOption } from "./RadioCardGroup";

// Shared by onboarding and the Me profile sheet, so both ask the same way.

export const GOAL_OPTIONS: { value: Goal; label: string; icon: Icon }[] = [
  { value: "train", label: "Train smarter", icon: IconBarbell },
  { value: "energy", label: "Plan my energy", icon: IconBolt },
  { value: "symptoms", label: "Understand symptoms", icon: IconNotes },
  { value: "irregular", label: "Track irregular cycles", icon: IconCalendarStats },
];

export const HORMONAL_NOTE = "Iszacycle will track symptoms and energy without ovulation predictions.";

export const CONTRACEPTION_OPTIONS: RadioCardOption<Contraception>[] = [
  { value: "none", label: "None" },
  { value: "hormonal", label: "Pill, patch, ring or injection", description: HORMONAL_NOTE },
  { value: "iud-hormonal", label: "Hormonal IUD", description: HORMONAL_NOTE },
  { value: "iud-copper", label: "Copper IUD" },
  { value: "other", label: "Other" },
];

export const ACTIVITY_OPTIONS: RadioCardOption<Profile["activityLevel"]>[] = [
  { value: "low", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "Very active" },
];

// Keeps the order of GOAL_OPTIONS so saved goals are stable.
export function toggleGoal(goals: Goal[], goal: Goal): Goal[] {
  const selected = goals.includes(goal);
  return GOAL_OPTIONS.map((option) => option.value).filter((value) =>
    value === goal ? !selected : goals.includes(value),
  );
}
