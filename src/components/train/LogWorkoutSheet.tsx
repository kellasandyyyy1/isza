import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { LogWorkoutForm, type WorkoutPrefill } from "./LogWorkoutForm";

interface LogWorkoutSheetProps {
  date: string;
  prefill?: WorkoutPrefill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// The form remounts on every open, so it always starts fresh or from the prefill.
export function LogWorkoutSheet({ date, prefill = null, open, onOpenChange, onSaved }: LogWorkoutSheetProps) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Log workout">
      <LogWorkoutForm date={date} prefill={prefill} onSaved={onSaved} />
    </ResponsiveSheet>
  );
}
