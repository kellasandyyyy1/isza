"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { deleteWorkout } from "@/db/repo";
import type { Workout } from "@/db/schema";
import { workoutTypeInfo } from "./workoutConfig";

interface DeleteWorkoutSheetProps {
  workout: Workout | null;
  onClose: () => void;
}

// Names exactly what will be deleted before deleting it.
export function DeleteWorkoutSheet({ workout, onClose }: DeleteWorkoutSheetProps) {
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (workout?.id === undefined) return;
    setDeleting(true);
    try {
      await deleteWorkout(workout.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ResponsiveSheet open={workout !== null} onOpenChange={(open) => !open && onClose()} title="Delete this workout?">
      {workout && (
        <div className="flex flex-col gap-3">
          <p className="text-body text-ink">
            This deletes your {workoutTypeInfo(workout.type).label} workout from{" "}
            {format(parseISO(workout.date), "EEE, MMM d")} ({workout.durationMin} min).
          </p>
          <Button fullWidth loading={deleting} onClick={() => void remove()}>
            Delete workout
          </Button>
          <Button fullWidth variant="ghost" disabled={deleting} onClick={onClose}>
            Keep it
          </Button>
        </div>
      )}
    </ResponsiveSheet>
  );
}
