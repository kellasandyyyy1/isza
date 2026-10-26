import { useId } from "react";
import { Chip } from "@/components/ui/Chip";
import type { Bleeding } from "@/db/schema";
import { BLEEDING_OPTIONS } from "./checkinConfig";
import { GroupLabel } from "./GroupLabel";

export function BleedingPicker({ value, onChange }: { value: Bleeding; onChange: (value: Bleeding) => void }) {
  const labelId = useId();
  return (
    <div>
      <GroupLabel id={labelId}>Bleeding</GroupLabel>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-3 gap-2">
        {BLEEDING_OPTIONS.map((option) => (
          <Chip key={option.value} size="compact" selected={value === option.value} onClick={() => onChange(option.value)}>
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
