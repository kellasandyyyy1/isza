import { differenceInCalendarDays, parseISO } from "date-fns";
import { VALIDATION_ENTRIES, type ValidationEntry, type ValidationId } from "@/content/validation";
import type { DailyLog, SymptomKey } from "@/db/schema";
import { phaseOnDate, type CompletedCycle, type CycleState, type Phase } from "./cycle";
import { SYMPTOM_LABELS, type Insight } from "./insights";

export interface ValidationSettings {
  validationCardsEnabled: boolean;
  // "yyyy-MM-dd" of the last card shown, or null.
  lastValidationShownAt: string | null;
  validationDismissCount: number;
}

export const DEFAULT_VALIDATION_SETTINGS: ValidationSettings = {
  validationCardsEnabled: true,
  lastValidationShownAt: null,
  validationDismissCount: 0,
};

export interface ValidationCard {
  id: ValidationId;
  title: string;
  body: string;
}

export interface ValidationInput {
  cycleState: CycleState;
  // The log just saved for today.
  todayLog: DailyLog;
  logs: DailyLog[];
  insights: Insight[];
  // Completed cycles, oldest first, for the personal mood count. Not in the step's list of inputs:
  // without it a past log cannot be placed in a phase.
  cycles: CompletedCycle[];
  settings: ValidationSettings;
  today: string;
}

// A card at most once in this many days.
const QUIET_DAYS = 3;
// Personal entries look at the last 5 completed cycles and need at least 3 of them.
const PERSONAL_WINDOW = 5;
const PERSONAL_MIN_CYCLES = 3;
// After this many dismissals the feature turns itself off.
const MAX_DISMISSALS = 3;

const PRIORITY: ValidationId[] = [
  "personal-symptom-pattern",
  "personal-mood-pattern",
  "menstrual-pain",
  "late-luteal-mood",
  "luteal-irritability",
  "menstrual-fatigue",
  "low-energy-no-phase",
];

interface Match {
  entry: ValidationEntry;
  card: ValidationCard;
  // The personal symptom card's symptom, to find the general entry it replaces.
  symptom?: SymptomKey;
}

function cardFor(entry: ValidationEntry, values: Record<string, string | number> = {}): ValidationCard {
  const body = entry.body.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
  return { id: entry.id, title: entry.title, body };
}

// In how many of the last completed cycles one of these moods was logged in this phase.
function moodCycleCount(
  logs: DailyLog[],
  cycles: CompletedCycle[],
  phase: Phase,
  moods: readonly string[],
): { count: number; of: number } {
  const firstIndex = Math.max(0, cycles.length - PERSONAL_WINDOW);
  const matched = new Set<number>();
  for (const log of logs) {
    if (log.mood === null || !moods.includes(log.mood)) continue;
    const located = phaseOnDate(cycles, log.date);
    if (located && located.cycleIndex >= firstIndex && located.phase === phase) matched.add(located.cycleIndex);
  }
  return { count: matched.size, of: cycles.length - firstIndex };
}

// Every entry whose trigger matches today's log. Personal entries carry their real counts.
function matchingEntries(input: ValidationInput): Match[] {
  const { cycleState, todayLog, logs, insights, cycles } = input;
  const phase = cycleState.phase;
  const matches: Match[] = [];

  for (const entry of VALIDATION_ENTRIES) {
    const trigger = entry.trigger;
    switch (trigger.kind) {
      case "late-luteal-mood":
        if (todayLog.mood !== null && trigger.moods.includes(todayLog.mood) && cycleState.isLateLuteal) {
          matches.push({ entry, card: cardFor(entry) });
        }
        break;
      case "symptom":
        if (
          phase === trigger.phase &&
          todayLog.symptoms.some((s) => trigger.symptoms.includes(s.key) && trigger.severities.includes(s.severity))
        ) {
          matches.push({ entry, card: cardFor(entry) });
        }
        break;
      case "energy-no-phase":
        if (phase === null && todayLog.energy !== null && trigger.levels.includes(todayLog.energy)) {
          matches.push({ entry, card: cardFor(entry) });
        }
        break;
      case "personal-mood": {
        if (phase === null || todayLog.mood === null || !trigger.moods.includes(todayLog.mood)) break;
        const { count, of } = moodCycleCount(logs, cycles, phase, trigger.moods);
        if (count >= PERSONAL_MIN_CYCLES) matches.push({ entry, card: cardFor(entry, { phase, n: count, m: of }) });
        break;
      }
      case "personal-symptom": {
        if (phase === null) break;
        const pattern = insights.find(
          (insight) =>
            insight.kind === "symptom-pattern" &&
            insight.phase === phase &&
            insight.pattern !== undefined &&
            insight.pattern.count >= PERSONAL_MIN_CYCLES &&
            todayLog.symptoms.some(
              (s) => s.key === insight.pattern?.symptom && trigger.severities.includes(s.severity),
            ),
        )?.pattern;
        if (pattern) {
          matches.push({
            entry,
            card: cardFor(entry, { Symptom: SYMPTOM_LABELS[pattern.symptom], phase, n: pattern.count, m: pattern.of }),
            symptom: pattern.symptom,
          });
        }
        break;
      }
    }
  }
  return matches;
}

// Does this personal match cover the same trigger as this general entry? The mood pattern covers the
// mood entry; the symptom pattern covers the general entry for that symptom.
function covers(personal: Match, general: ValidationEntry): boolean {
  if (personal.entry.trigger.kind === "personal-mood") return general.trigger.kind === "late-luteal-mood";
  if (personal.entry.trigger.kind === "personal-symptom" && general.trigger.kind === "symptom" && personal.symptom) {
    return general.trigger.symptoms.includes(personal.symptom);
  }
  return false;
}

// At most one supportive card for today's check-in, or null. Pure: no React, no database.
export function getValidationCard(input: ValidationInput): ValidationCard | null {
  const { settings, today } = input;
  // a. Turned off.
  if (!settings.validationCardsEnabled) return null;
  // b. A card was shown in the last 3 days.
  if (
    settings.lastValidationShownAt !== null &&
    differenceInCalendarDays(parseISO(today), parseISO(settings.lastValidationShownAt)) < QUIET_DAYS
  ) {
    return null;
  }
  // c. Every matching entry.
  const matches = matchingEntries(input);
  // d. A personal match replaces the general entry for the same trigger.
  const personal = matches.filter((match) => match.entry.requiresPersonal);
  const kept = matches.filter(
    (match) => match.entry.requiresPersonal || !personal.some((p) => covers(p, match.entry)),
  );
  // e. The first by priority. f. Null when nothing matches.
  const ranked = [...kept].sort((a, b) => PRIORITY.indexOf(a.entry.id) - PRIORITY.indexOf(b.entry.id));
  return ranked[0]?.card ?? null;
}

// The settings after a card is shown today.
export function recordValidationShown(settings: ValidationSettings, today: string): ValidationSettings {
  return { ...settings, lastValidationShownAt: today };
}

// The settings after a Dismiss. The third dismissal quietly turns the feature off.
export function recordValidationDismissed(settings: ValidationSettings): ValidationSettings {
  const validationDismissCount = settings.validationDismissCount + 1;
  return {
    ...settings,
    validationDismissCount,
    validationCardsEnabled: validationDismissCount >= MAX_DISMISSALS ? false : settings.validationCardsEnabled,
  };
}

// Turning the switch back on starts the dismissal count again, so one more Dismiss does not turn it off.
export function setValidationEnabled(settings: ValidationSettings, enabled: boolean): ValidationSettings {
  return { ...settings, validationCardsEnabled: enabled, validationDismissCount: enabled ? 0 : settings.validationDismissCount };
}
