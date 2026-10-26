"use client";

import { IconBarbell } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Workout } from "@/db/schema";
import { phaseForDate, type CalendarContext } from "@/lib/calendar";
import { LOG_PAGE_SIZE, newestFirst } from "@/lib/training";
import { DeleteWorkoutSheet } from "./DeleteWorkoutSheet";
import { WorkoutRow } from "./WorkoutRow";

interface WorkoutLogTabProps {
  workouts: Workout[];
  context: CalendarContext;
  onLogWorkout: () => void;
}

// Newest first, 5 at a time.
export function WorkoutLogTab({ workouts, context, onLogWorkout }: WorkoutLogTabProps) {
  const [shown, setShown] = useState(LOG_PAGE_SIZE);
  const [toDelete, setToDelete] = useState<Workout | null>(null);
  const sorted = newestFirst(workouts);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={IconBarbell}
        mascot={{ pose: "train" }}
        title="No workouts yet"
        text="Logged workouts show up here, newest first."
        action={{ label: "Log workout", onClick: onLogWorkout }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul aria-label="Workouts" className="flex flex-col gap-2">
        {sorted.slice(0, shown).map((workout) => (
          <WorkoutRow
            key={workout.id}
            workout={workout}
            phase={phaseForDate(context, workout.date)?.phase ?? null}
            onDelete={() => setToDelete(workout)}
          />
        ))}
      </ul>
      {sorted.length > shown && (
        <Button variant="secondary" fullWidth onClick={() => setShown((count) => count + LOG_PAGE_SIZE)}>
          Show more
        </Button>
      )}
      <DeleteWorkoutSheet workout={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
