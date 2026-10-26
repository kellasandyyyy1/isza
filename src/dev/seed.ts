// Demo data for development only. Loaded from the "Load demo data" button on /dev/ui.
import { addDays, differenceInCalendarDays, format, getDay, subDays } from "date-fns";
import { importAll } from "@/db/repo";
import {
  EXPORT_VERSION,
  type Bleeding,
  type DailyLog,
  type Energy,
  type ExportData,
  type Mood,
  type SymptomEntry,
  type WorkoutType,
} from "@/db/schema";

export const DEMO_CYCLE_LENGTHS = [27, 29, 28, 30] as const;
export const DEMO_PERIOD_LENGTH = 5;
// The current cycle started this many days before today.
const CURRENT_CYCLE_DAY = 11;
// Used to place phases in the cycle that is still in progress.
const CURRENT_CYCLE_ASSUMED_LENGTH = 28;
const WORKOUT_WEEKDAYS = [1, 3, 6]; // Monday, Wednesday, Saturday
const PERIOD_BLEEDING: Bleeding[] = ["medium", "heavy", "medium", "light", "spotting"];
const MOODS: Mood[] = ["bad", "low", "okay", "good", "great"];

type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

// Small seeded random generator so demo data is the same on every load.
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");
const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

function phaseFor(cycleDay: number, cycleLength: number): Phase {
  const ovulationDay = cycleLength - 14;
  if (cycleDay <= DEMO_PERIOD_LENGTH) return "menstrual";
  if (cycleDay < ovulationDay - 1) return "follicular";
  if (cycleDay <= ovulationDay + 1) return "ovulatory";
  return "luteal";
}

export function generateDemoData(today: Date = new Date()): ExportData {
  const random = createRandom(42);
  const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const chance = (probability: number) => random() < probability;

  // Five period starts give four completed cycles plus the current one.
  const currentStart = subDays(today, CURRENT_CYCLE_DAY - 1);
  const starts = [currentStart];
  for (const length of [...DEMO_CYCLE_LENGTHS].reverse()) starts.unshift(subDays(starts[0], length));
  const cycleLengths = [...DEMO_CYCLE_LENGTHS, CURRENT_CYCLE_ASSUMED_LENGTH];

  const periods = starts.map((start, index) => ({
    id: index + 1,
    startDate: toIsoDate(start),
    endDate: toIsoDate(addDays(start, DEMO_PERIOD_LENGTH - 1)),
  }));

  const dailyLogs: DailyLog[] = [];
  const workouts: ExportData["workouts"] = [];
  const totalDays = differenceInCalendarDays(today, starts[0]);

  for (let offset = 0; offset <= totalDays; offset++) {
    const date = addDays(starts[0], offset);
    const cycleIndex = starts.findLastIndex((start) => start <= date);
    const cycleLength = cycleLengths[cycleIndex];
    const cycleDay = differenceInCalendarDays(date, starts[cycleIndex]) + 1;
    const phase = phaseFor(cycleDay, cycleLength);
    const ovulationDay = cycleLength - 14;
    const lateLuteal = phase === "luteal" && cycleDay > cycleLength - 5;
    const isoDate = toIsoDate(date);

    const energyRange: Record<Phase, [number, number]> = {
      menstrual: [2, 3],
      follicular: [3, 4],
      ovulatory: [4, 5],
      luteal: lateLuteal ? [2, 3] : [3, 4],
    };
    const energy = between(...energyRange[phase]) as Energy;
    const mood = MOODS[Math.min(4, Math.max(0, energy - 1 + between(-1, 0)))];

    const symptoms: SymptomEntry[] = [];
    if (phase === "menstrual" && cycleDay <= 2) symptoms.push({ key: "cramps", severity: chance(0.5) ? 3 : 2 });
    if (phase === "menstrual" && cycleDay === 3) symptoms.push({ key: "cramps", severity: 1 });
    if (phase === "menstrual" && cycleDay <= 3 && chance(0.6)) symptoms.push({ key: "fatigue", severity: 2 });
    if (phase === "menstrual" && chance(0.2)) symptoms.push({ key: "back-pain", severity: 1 });
    if (lateLuteal) {
      symptoms.push({ key: "bloating", severity: chance(0.5) ? 2 : 1 });
      if (chance(0.6)) symptoms.push({ key: "cravings", severity: 2 });
      if (chance(0.4)) symptoms.push({ key: "irritability", severity: 1 });
      if (chance(0.5)) symptoms.push({ key: "breast-tenderness", severity: 1 });
    }
    if (chance(0.06)) symptoms.push({ key: "headache", severity: 1 });

    let lhTest: DailyLog["lhTest"] = null;
    if (cycleDay === ovulationDay - 3 || cycleDay === ovulationDay - 2) lhTest = "negative";
    if (cycleDay === ovulationDay - 1) lhTest = "positive";

    dailyLogs.push({
      date: isoDate,
      bleeding: phase === "menstrual" ? PERIOD_BLEEDING[cycleDay - 1] : "none",
      energy,
      mood,
      symptoms,
      sleepHours: round(between(26, 34) / 4 - (lateLuteal ? 0.5 : 0), 2),
      bbt: round((cycleDay > ovulationDay ? 36.7 : 36.3) + between(0, 20) / 100, 2),
      lhTest,
      note: null,
      updatedAt: `${isoDate}T20:00:00.000Z`,
    });

    if (WORKOUT_WEEKDAYS.includes(getDay(date))) {
      const typeByPhase: Record<Phase, WorkoutType[]> = {
        menstrual: ["mobility", "cardio"],
        follicular: ["strength", "hiit", "strength"],
        ovulatory: ["hiit", "strength"],
        luteal: lateLuteal ? ["mobility", "cardio"] : ["strength", "cardio"],
      };
      const options = typeByPhase[phase];
      const rpeRange: Record<Phase, [number, number]> = {
        menstrual: [3, 5],
        follicular: [6, 8],
        ovulatory: [7, 9],
        luteal: lateLuteal ? [4, 6] : [5, 7],
      };
      workouts.push({
        id: workouts.length + 1,
        date: isoDate,
        type: options[between(0, options.length - 1)],
        durationMin: between(6, 12) * 5,
        rpe: between(...rpeRange[phase]),
        feel: energy >= 4 ? "strong" : energy <= 2 ? "weak" : "normal",
        note: null,
      });
    }
  }

  return {
    version: EXPORT_VERSION,
    profile: {
      id: "me",
      name: null,
      goals: ["train", "energy"],
      contraception: "none",
      typicalCycleLength: 28,
      typicalPeriodLength: DEMO_PERIOD_LENGTH,
      activityLevel: "moderate",
      workoutTypes: ["strength", "hiit", "cardio", "mobility"],
      onboardingComplete: true,
      discreetMode: false,
      createdAt: `${periods[0].startDate}T08:00:00.000Z`,
    },
    periods,
    dailyLogs,
    workouts,
    supplies: [],
    reminders: [],
    dismissedFlags: [],
    settings: [],
  };
}

// Replaces all data on this device with demo data.
export async function loadDemoData(): Promise<void> {
  if (process.env.NODE_ENV !== "development") throw new Error("Demo data is only available in development.");
  await importAll(generateDemoData());
}
