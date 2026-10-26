import type { Contraception, DailyLog, Period, Profile, SymptomKey } from "@/db/schema";
import { symptomKeySchema } from "@/db/schema";
import { recentCycles, type CycleBar } from "./cycleHistory";
import { PHASES, completedCycles, computeCycleState, phaseOnDate, type Phase } from "./cycle";
import { computeFlags } from "./flags";
import { SYMPTOM_LABELS } from "./insights";

export type ReportCycleCount = 3 | 6;

export const CONTRACEPTION_LABELS: Record<Contraception, string> = {
  none: "None",
  hormonal: "Pill, patch, ring or injection",
  "iud-hormonal": "Hormonal IUD",
  "iud-copper": "Copper IUD",
  other: "Other",
};

export const REPORT_FOOTER =
  "Isza is not a medical device or a contraceptive. This summary is based on self-reported data.";

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export interface LengthStats {
  average: number;
  min: number;
  max: number;
}

function lengthStats(values: number[]): LengthStats | null {
  if (values.length === 0) return null;
  return {
    average: roundToTenth(values.reduce((sum, value) => sum + value, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export interface SymptomRow {
  symptom: string;
  // Days with the symptom, per phase. In hormonal and irregular modes only "all" is filled.
  byPhase: Record<Phase, number>;
  all: number;
}

export interface ReportData {
  createdOn: string;
  range: { from: string; to: string };
  contraception: string;
  cycleLength: LengthStats | null;
  periodLength: LengthStats | null;
  cycles: CycleBar[];
  // False in hormonal and irregular modes, where Isza does not assign phases.
  showPhases: boolean;
  symptoms: SymptomRow[];
  flags: { title: string; body: string }[];
  // Null when notes are switched off.
  notes: { date: string; text: string }[] | null;
}

export interface ReportInput {
  periods: Period[];
  profile: Profile | null;
  logs: DailyLog[];
  today: string;
  cycleCount: ReportCycleCount;
  includeNotes: boolean;
}

// Null until there is at least one completed cycle to report on.
export function buildReport({ periods, profile, logs, today, cycleCount, includeNotes }: ReportInput): ReportData | null {
  const cycles = recentCycles(periods, profile, cycleCount);
  if (cycles.length === 0) return null;
  const from = cycles[0].startDate;

  const cycle = computeCycleState({ periods, profile, logs, today });
  const showPhases = cycle.mode === "standard";
  const allCompleted = completedCycles(periods, profile);
  const included = allCompleted.slice(-cycles.length);

  // Symptom days inside the included completed cycles.
  const counts = new Map<SymptomKey, SymptomRow>();
  for (const log of logs) {
    const located = phaseOnDate(included, log.date);
    if (!located) continue;
    for (const { key } of log.symptoms) {
      const row =
        counts.get(key) ??
        ({ symptom: SYMPTOM_LABELS[key], byPhase: Object.fromEntries(PHASES.map((p) => [p, 0])), all: 0 } as SymptomRow);
      row.all += 1;
      if (showPhases) row.byPhase[located.phase] += 1;
      counts.set(key, row);
    }
  }

  return {
    createdOn: today,
    range: { from, to: today },
    contraception: profile ? CONTRACEPTION_LABELS[profile.contraception] : "Not set",
    cycleLength: lengthStats(cycles.map((item) => item.length)),
    periodLength: lengthStats(cycles.map((item) => item.periodLength).filter((value) => value !== null)),
    cycles,
    showPhases,
    symptoms: symptomKeySchema.options.flatMap((key) => {
      const row = counts.get(key);
      return row ? [row] : [];
    }),
    // Every raised flag, including ones hidden on the Today screen: the doctor should see them.
    flags: computeFlags({ cycle, periods, logs, profile, dismissedFlags: [], today }).map(({ title, body }) => ({
      title,
      body,
    })),
    notes: includeNotes
      ? logs
          .filter((log) => log.note && log.date >= from && log.date <= today)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((log) => ({ date: log.date, text: log.note ?? "" }))
      : null,
  };
}

export function reportFileName(today: string): string {
  return `isza-report-${today}.pdf`;
}
