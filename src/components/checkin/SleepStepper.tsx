import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { SLEEP_RANGE, stepSleep } from "@/lib/checkin";
import { GroupLabel } from "./GroupLabel";

export function SleepStepper({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const labelId = useId();
  return (
    <div>
      <GroupLabel id={labelId}>Sleep</GroupLabel>
      <div role="group" aria-labelledby={labelId} className="flex items-center gap-3">
        <IconButton
          icon={IconMinus}
          aria-label="Half an hour less"
          disabled={value === SLEEP_RANGE.min}
          onClick={() => onChange(stepSleep(value, -1))}
          className="bg-surface-2"
        />
        <output aria-live="polite" className="min-w-24 text-center text-body-strong text-ink">
          {value === null ? "Not set" : `${value} hours`}
        </output>
        <IconButton
          icon={IconPlus}
          aria-label="Half an hour more"
          disabled={value === SLEEP_RANGE.max}
          onClick={() => onChange(stepSleep(value, 1))}
          className="bg-surface-2"
        />
        {value !== null && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
