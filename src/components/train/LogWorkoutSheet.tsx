import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { LogWorkoutForm } from "./LogWorkoutForm";

interface LogWorkoutSheetProps {
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// The form remounts on every open, so it always starts fresh.
export function LogWorkoutSheet({ date, open, onOpenChange, onSaved }: LogWorkoutSheetProps) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Log workout">
      <LogWorkoutForm date={date} onSaved={onSaved} />
    </ResponsiveSheet>
  );
}
