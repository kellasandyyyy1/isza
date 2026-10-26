"use client";

import { useId, useState } from "react";
import { GroupLabel } from "@/components/checkin/GroupLabel";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Slider } from "@/components/ui/Slider";
import { addWorkout } from "@/db/repo";
import type { WorkoutType } from "@/db/schema";
import { DURATION_RANGE, EFFORT_RANGE, WORKOUT_NOTE_MAX_LENGTH, workoutFormSchema, type WorkoutForm } from "@/lib/training";
import { DurationStepper } from "./DurationStepper";
import { FEEL_OPTIONS, WORKOUT_TYPES } from "./workoutConfig";

interface LogWorkoutFormProps {
  date: string;
  onSaved: () => void;
}

export function LogWorkoutForm({ date, onSaved }: LogWorkoutFormProps) {
  const ids = { type: useId(), feel: useId(), note: useId(), noteCount: useId() };
  const [type, setType] = useState<WorkoutType | null>(null);
  const [durationMin, setDuration] = useState<number>(DURATION_RANGE.initial);
  const [rpe, setRpe] = useState<number>(EFFORT_RANGE.initial);
  const [feel, setFeel] = useState<WorkoutForm["feel"]>("normal");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const parsed = workoutFormSchema.safeParse({ date, type, durationMin, rpe, feel, note: note.trim() || null });
    if (!parsed.success) {
      setError("Pick a workout type first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addWorkout(parsed.data);
      onSaved();
    } catch {
      setError("Something went wrong while saving. Please try again.");
      setSaving(false);
    }
  }

  // Tight spacing keeps the whole form in one sheet without scrolling at 360x640.
  return (
    <div className="flex flex-col gap-2">
      <div>
        <GroupLabel id={ids.type}>Type</GroupLabel>
        <div role="group" aria-labelledby={ids.type} className="grid grid-cols-3 gap-2">
          {WORKOUT_TYPES.map(({ value, label, icon }) => (
            <Chip key={value} size="compact" icon={icon} selected={type === value} onClick={() => setType(value)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <DurationStepper value={durationMin} onChange={setDuration} />

      <Slider
        label="Effort"
        value={rpe}
        onValueChange={setRpe}
        min={EFFORT_RANGE.min}
        max={EFFORT_RANGE.max}
        // "of 10" carries the scale; there is no room for end captions at 360x640.
        formatValue={(value) => `${value} of 10`}
      />

      <div>
        <GroupLabel id={ids.feel}>How did it feel?</GroupLabel>
        <div role="group" aria-labelledby={ids.feel} className="grid grid-cols-3 gap-2">
          {FEEL_OPTIONS.map((option) => (
            <Chip key={option.value} size="compact" selected={feel === option.value} onClick={() => setFeel(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-small text-ink-muted">
          <label htmlFor={ids.note}>Note (optional)</label>
          <span id={ids.noteCount}>
            {note.length}/{WORKOUT_NOTE_MAX_LENGTH}
          </span>
        </div>
        <input
          id={ids.note}
          type="text"
          maxLength={WORKOUT_NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby={ids.noteCount}
          className="h-12 w-full rounded-input bg-surface-2 px-4 text-body text-ink"
        />
      </div>

      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button fullWidth disabled={type === null} loading={saving} onClick={() => void save()}>
        Save workout
      </Button>
    </div>
  );
}
