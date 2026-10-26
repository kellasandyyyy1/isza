import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ViewHeader } from "./ViewHeader";

interface RemovePeriodViewProps {
  headingId: string;
  date: string;
  saving: boolean;
  onConfirm: () => void;
  onKeep: () => void;
}

// Confirmation for turning off a saved "My period started" switch. Shown inside the same sheet.
export function RemovePeriodView({ headingId, date, saving, onConfirm, onKeep }: RemovePeriodViewProps) {
  return (
    <div className="flex flex-col gap-3">
      <ViewHeader id={headingId} title="Remove this period start?" onBack={onKeep} backDisabled={saving} />
      <p className="text-body text-ink">
        This deletes the period that started on {format(parseISO(date), "EEE, MMM d")}. The rest of your check-in is
        kept.
      </p>
      <Button fullWidth loading={saving} onClick={onConfirm}>
        Remove period and save
      </Button>
      <Button fullWidth variant="ghost" disabled={saving} onClick={onKeep}>
        Keep the period
      </Button>
    </div>
  );
}
