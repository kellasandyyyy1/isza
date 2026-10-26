import { IconMoodCry, IconMoodEmpty, IconMoodHappy, IconMoodSad, IconMoodSmile, type Icon } from "@tabler/icons-react";
import { symptomKeySchema, type Bleeding, type DailyLog, type Mood, type SymptomKey } from "@/db/schema";
import { SYMPTOM_LABELS } from "@/lib/insights";

export const BLEEDING_OPTIONS: { value: Bleeding; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
  { value: "very-heavy", label: "Very heavy" },
];

export const MOOD_OPTIONS: { value: Mood; label: string; icon: Icon }[] = [
  { value: "great", label: "Great", icon: IconMoodHappy },
  { value: "good", label: "Good", icon: IconMoodSmile },
  { value: "okay", label: "Okay", icon: IconMoodEmpty },
  { value: "low", label: "Low", icon: IconMoodSad },
  { value: "bad", label: "Bad", icon: IconMoodCry },
];

export const SYMPTOM_OPTIONS: { key: SymptomKey; label: string }[] = symptomKeySchema.options.map((key) => ({
  key,
  label: SYMPTOM_LABELS[key],
}));

export const LH_OPTIONS: { value: DailyLog["lhTest"]; label: string }[] = [
  { value: null, label: "Not taken" },
  { value: "negative", label: "Negative" },
  { value: "positive", label: "Positive" },
];
