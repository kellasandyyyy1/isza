// Builders shared by the cycle, readiness, flags and insights tests.
import type { DailyLog, Period, Profile, Workout } from "@/db/schema";
import { shiftDate } from "./cycle";

export function makeLog(date: string, fields: Partial<Omit<DailyLog, "date">> = {}): DailyLog {
  return {
    date,
    bleeding: "none",
    energy: null,
    mood: null,
    symptoms: [],
    sleepHours: null,
    bbt: null,
    lhTest: null,
    note: null,
    updatedAt: `${date}T20:00:00.000Z`,
    ...fields,
  };
}

export function makeProfile(fields: Partial<Profile> = {}): Profile {
  return {
    id: "me",
    name: null,
    goals: [],
    contraception: "none",
    typicalCycleLength: null,
    typicalPeriodLength: null,
    activityLevel: "moderate",
    workoutTypes: [],
    onboardingComplete: true,
    discreetMode: false,
    createdAt: "2026-01-01T08:00:00.000Z",
    ...fields,
  };
}

export function makeWorkout(date: string, feel: Workout["feel"]): Workout {
  return { date, type: "strength", durationMin: 45, rpe: 6, feel, note: null };
}

// Period starts separated by the given cycle lengths. Each period lasts periodLength days.
export function periodsFromLengths(firstStart: string, lengths: number[], periodLength = 5): Period[] {
  const starts = [firstStart];
  for (const length of lengths) starts.push(shiftDate(starts[starts.length - 1], length));
  return starts.map((startDate, index) => ({
    id: index + 1,
    startDate,
    endDate: shiftDate(startDate, periodLength - 1),
  }));
}

// The date of a given 1-based cycle day.
export const dayOf = (cycleStart: string, cycleDay: number) => shiftDate(cycleStart, cycleDay - 1);
