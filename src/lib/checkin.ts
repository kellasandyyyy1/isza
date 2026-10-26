import { z } from "zod";
import {
  bleedingSchema,
  energySchema,
  moodSchema,
  symptomEntrySchema,
  type DailyLog,
  type Period,
  type Severity,
  type SymptomEntry,
  type SymptomKey,
} from "@/db/schema";
import { clamp } from "./clamp";
import { sortPeriods } from "./cycle";

export const SLEEP_RANGE = { min: 0, max: 14, step: 0.5, start: 7 } as const;
export const BBT_RANGE = { min: 35, max: 38.5 } as const;
export const NOTE_MAX_LENGTH = 280;

// The check-in form's answers. Tighter than the stored log: these are the limits the form offers.
export const checkInSchema = z.object({
  bleeding: bleedingSchema,
  energy: energySchema.nullable(),
  mood: moodSchema.nullable(),
  symptoms: z.array(symptomEntrySchema),
  sleepHours: z.number().min(SLEEP_RANGE.min).max(SLEEP_RANGE.max).multipleOf(SLEEP_RANGE.step).nullable(),
  bbt: z.number().min(BBT_RANGE.min).max(BBT_RANGE.max).nullable(),
  lhTest: z.enum(["positive", "negative"]).nullable(),
  note: z.string().max(NOTE_MAX_LENGTH).nullable(),
});
export type CheckInDraft = z.infer<typeof checkInSchema>;

export function draftFromLog(log: DailyLog | null): CheckInDraft {
  return {
    bleeding: log?.bleeding ?? "none",
    energy: log?.energy ?? null,
    mood: log?.mood ?? null,
    symptoms: log?.symptoms ?? [],
    sleepHours: log?.sleepHours ?? null,
    bbt: log?.bbt ?? null,
    lhTest: log?.lhTest ?? null,
    note: log?.note ?? null,
  };
}

// Symptoms

export type SymptomLevel = 0 | Severity;
export const SYMPTOM_LEVEL_NAMES: Record<SymptomLevel, string> = { 0: "off", 1: "mild", 2: "moderate", 3: "severe" };

export function symptomLevel(symptoms: SymptomEntry[], key: SymptomKey): SymptomLevel {
  return symptoms.find((entry) => entry.key === key)?.severity ?? 0;
}

// Each tap moves off, mild, moderate, severe, then back to off.
export function cycleSymptom(symptoms: SymptomEntry[], key: SymptomKey): SymptomEntry[] {
  const level = symptomLevel(symptoms, key);
  if (level === 0) return [...symptoms, { key, severity: 1 }];
  if (level === 3) return symptoms.filter((entry) => entry.key !== key);
  const severity = (level + 1) as Severity;
  return symptoms.map((entry) => (entry.key === key ? { key, severity } : entry));
}

// Sleep and temperature

// From "not set", either button starts at 7 hours.
export function stepSleep(hours: number | null, direction: 1 | -1): number {
  if (hours === null) return SLEEP_RANGE.start;
  return clamp(hours + direction * SLEEP_RANGE.step, SLEEP_RANGE.min, SLEEP_RANGE.max);
}

// Empty is fine (the field is optional). Accepts a comma as the decimal mark.
export function parseTemperature(text: string): { value: number | null; error: string | null } {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return { value: null, error: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { value: null, error: "Enter a number, like 36.5." };
  if (value < BBT_RANGE.min || value > BBT_RANGE.max) return { value: null, error: "Use a value from 35.0 to 38.5." };
  return { value: Math.round(value * 100) / 100, error: null };
}

// Period switch

// "start": the switch reads "My period started". On when a period already starts on this date.
// "end": the switch reads "My period ended". Shown while a period is open, on when it ends on this date.
export type PeriodToggle =
  | { kind: "start"; savedPeriodId: number | null }
  | { kind: "end"; periodId: number; endsOnDate: boolean };

export function periodToggleFor(periods: Period[], date: string): PeriodToggle {
  const sorted = sortPeriods(periods);
  const startsHere = sorted.find((period) => period.startDate === date);
  if (startsHere?.id !== undefined) return { kind: "start", savedPeriodId: startsHere.id };
  const endsHere = sorted.find((period) => period.endDate === date);
  if (endsHere?.id !== undefined) return { kind: "end", periodId: endsHere.id, endsOnDate: true };
  const open = sorted.filter((period) => period.startDate < date && period.endDate === null).at(-1);
  if (open?.id !== undefined) return { kind: "end", periodId: open.id, endsOnDate: false };
  return { kind: "start", savedPeriodId: null };
}

export function isToggleInitiallyOn(toggle: PeriodToggle): boolean {
  return toggle.kind === "start" ? toggle.savedPeriodId !== null : toggle.endsOnDate;
}

export type PeriodChange =
  | { type: "none" }
  | { type: "start"; startDate: string }
  | { type: "end"; periodId: number; endDate: string }
  | { type: "reopen"; periodId: number }
  | { type: "remove"; periodId: number };

export function periodChangeFor(toggle: PeriodToggle, on: boolean, date: string): PeriodChange {
  if (toggle.kind === "start") {
    if (on && toggle.savedPeriodId === null) return { type: "start", startDate: date };
    if (!on && toggle.savedPeriodId !== null) return { type: "remove", periodId: toggle.savedPeriodId };
    return { type: "none" };
  }
  if (on && !toggle.endsOnDate) return { type: "end", periodId: toggle.periodId, endDate: date };
  if (!on && toggle.endsOnDate) return { type: "reopen", periodId: toggle.periodId };
  return { type: "none" };
}
