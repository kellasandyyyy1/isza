import type { Energy, Mood, Severity, SymptomKey } from "@/db/schema";
import type { Phase } from "@/lib/cycle";

// Supportive notes after a hard check-in. They describe and validate: never a diagnosis, never advice,
// never a prediction of how she will feel. src/lib/validation.ts picks at most one.

export type ValidationTrigger =
  // A mood in the days before a predicted period.
  | { kind: "late-luteal-mood"; moods: Mood[] }
  // One of these symptoms at one of these severities, in this phase.
  | { kind: "symptom"; symptoms: SymptomKey[]; severities: Severity[]; phase: Phase }
  // Energy at one of these levels while phases are hidden (hormonal, irregular or no-data mode).
  | { kind: "energy-no-phase"; levels: Energy[] }
  // A mood she has logged in this phase in 3 or more of her last 5 completed cycles.
  | { kind: "personal-mood"; moods: Mood[] }
  // A symptom at one of these severities that insights.ts already reports as a pattern for this phase.
  | { kind: "personal-symptom"; severities: Severity[] };

export type ValidationId =
  | "late-luteal-mood"
  | "menstrual-fatigue"
  | "menstrual-pain"
  | "luteal-irritability"
  | "low-energy-no-phase"
  | "personal-mood-pattern"
  | "personal-symptom-pattern";

export interface ValidationEntry {
  id: ValidationId;
  trigger: ValidationTrigger;
  // Shown only when her own logs back it, and then in place of the matching general entry.
  requiresPersonal: boolean;
  title: string;
  // At most 2 sentences, under 30 words, never starting with "You". Personal bodies fill
  // {phase}, {n}, {m} and {Symptom} with real counts.
  body: string;
}

export const VALIDATION_ENTRIES: ValidationEntry[] = [
  {
    id: "late-luteal-mood",
    trigger: { kind: "late-luteal-mood", moods: ["low", "bad"] },
    requiresPersonal: false,
    title: "This is a common time to feel low",
    body: "Mood often dips in the days before a period. For many people it lifts once their period starts.",
  },
  {
    id: "menstrual-fatigue",
    trigger: { kind: "symptom", symptoms: ["fatigue"], severities: [2, 3], phase: "menstrual" },
    requiresPersonal: false,
    title: "Tiredness is common on these days",
    body: "Many people feel more tired during their period. Energy often returns as the days go on.",
  },
  {
    id: "menstrual-pain",
    trigger: { kind: "symptom", symptoms: ["cramps"], severities: [3], phase: "menstrual" },
    requiresPersonal: false,
    title: "Period pain is common and it is real",
    body: "Many people get strong cramps during their period. Pain that stops you doing normal things is worth raising with a doctor.",
  },
  {
    id: "luteal-irritability",
    trigger: { kind: "symptom", symptoms: ["irritability", "anxiety"], severities: [2, 3], phase: "luteal" },
    requiresPersonal: false,
    title: "This is common in the second half",
    body: "Irritability and restlessness often show up in the luteal phase. Many people notice it eases when their period begins.",
  },
  {
    id: "low-energy-no-phase",
    trigger: { kind: "energy-no-phase", levels: [1, 2] },
    requiresPersonal: false,
    title: "Low days happen",
    body: "Energy moves around for many reasons, including sleep, stress and your cycle. Logging it is how the pattern shows up.",
  },
  {
    id: "personal-mood-pattern",
    trigger: { kind: "personal-mood", moods: ["low", "bad"] },
    requiresPersonal: true,
    title: "This matches your own pattern",
    body: "A low mood has shown up in your {phase} phase in {n} of your last {m} cycles.",
  },
  {
    id: "personal-symptom-pattern",
    trigger: { kind: "personal-symptom", severities: [2, 3] },
    requiresPersonal: true,
    title: "This matches your own pattern",
    body: "{Symptom} has shown up in your {phase} phase in {n} of your last {m} cycles.",
  },
];
