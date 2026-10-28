"use client";

import { useState } from "react";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { bandAdvice } from "@/content/guidance";
import { phaseNote, presetByType, suggestedByBand, type PlanWorkoutType } from "@/content/training";
import type { Workout } from "@/db/schema";
import type { CalendarContext } from "@/lib/calendar";
import type { TodayView } from "@/lib/today";
import { lastWorkout, prefersLighter, sessionPrefill } from "@/lib/training";
import { LastSessionRow } from "./LastSessionRow";
import type { WorkoutPrefill } from "./LogWorkoutForm";
import { SuggestedSessionCard, type PlanSession } from "./SuggestedSessionCard";
import { WeekStrip } from "./WeekStrip";
import { workoutTypeInfo } from "./workoutConfig";
import { WorkoutSwapRow } from "./WorkoutSwapRow";

interface TrainTodayTabProps {
  view: TodayView;
  context: CalendarContext;
  workouts: Workout[];
  onStart: (prefill: WorkoutPrefill) => void;
  // Bumped after a workout is saved, so the mascot cheers.
  cheerKey: number;
}

// The Plan tab: today's suggested session, a swap row, this week and the last session.
export function TrainTodayTab({ view, context, workouts, onStart, cheerKey }: TrainTodayTabProps) {
  const { readiness, cycle, today } = view;
  // Null shows the band's suggestion. A swap chip replaces it with that type's preset.
  const [chosen, setChosen] = useState<PlanWorkoutType | null>(null);

  const session: PlanSession = chosen
    ? {
        type: chosen,
        title: workoutTypeInfo(chosen).label,
        durationMin: presetByType[chosen].durationMin,
        effort: String(presetByType[chosen].effort),
      }
    : suggestedByBand[readiness.band].main;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <MascotSlot pose="train" size="sm" motion="idle" cheerKey={cheerKey} />
        <div className="min-w-0">
          <p className="text-h2 text-ink">
            <span className="sr-only">Readiness </span>
            {readiness.score}, {readiness.band}
          </p>
          <p className="text-small text-ink-muted">{bandAdvice[readiness.band]}</p>
        </div>
      </div>

      <SuggestedSessionCard
        session={session}
        phaseNote={phaseNote(cycle.phase, cycle.isLateLuteal)}
        onStart={() => onStart({ type: session.type, ...sessionPrefill(session.durationMin, session.effort) })}
      />
      {prefersLighter(readiness.band, session.type) && (
        <p className="shrink-0 text-small text-ink-muted">Your readiness is low today. You may prefer something lighter.</p>
      )}

      <WorkoutSwapRow chosen={chosen} onChoose={setChosen} />
      <WeekStrip context={context} workouts={workouts} />
      <LastSessionRow workout={lastWorkout(workouts, today)} today={today} />
    </div>
  );
}
