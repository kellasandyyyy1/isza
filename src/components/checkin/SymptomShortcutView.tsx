import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SymptomEntry } from "@/db/schema";
import { SYMPTOM_LEVEL_NAMES, cycleSymptom, symptomLevel } from "@/lib/checkin";
import { SYMPTOM_OPTIONS } from "./checkinConfig";
import { SymptomChip } from "./SymptomChip";

interface SymptomShortcutViewProps {
  symptoms: SymptomEntry[];
  // What today's log already has, so Save only lights up once something changed.
  savedSymptoms: SymptomEntry[];
  onChange: (symptoms: SymptomEntry[]) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

const sameSymptoms = (a: SymptomEntry[], b: SymptomEntry[]) =>
  a.length === b.length && a.every((entry) => symptomLevel(b, entry.key) === entry.severity);

function saveLabel(count: number): string {
  if (count === 0) return "Remove symptoms";
  return count === 1 ? "Save 1 symptom" : `Save ${count} symptoms`;
}

// The "+" on Today: only the symptoms, saved straight into today's log. The sheet's title names it, so there is
// no second header or back arrow into the full check-in. Each chip says its level while it is on.
export function SymptomShortcutView({ symptoms, savedSymptoms, onChange, onSave, saving, error }: SymptomShortcutViewProps) {
  const hintId = useId();
  const [announcement, setAnnouncement] = useState("");
  const changed = !sameSymptoms(symptoms, savedSymptoms);

  function tap(key: SymptomEntry["key"], label: string) {
    const next = cycleSymptom(symptoms, key);
    onChange(next);
    setAnnouncement(`${label}: ${SYMPTOM_LEVEL_NAMES[symptomLevel(next, key)]}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <p id={hintId} className="text-small text-ink-muted">
        Tap to add. Tap again for moderate, then severe. A fourth tap removes it.
      </p>
      <div role="group" aria-label="Symptoms" aria-describedby={hintId} className="grid grid-cols-3 gap-2">
        {SYMPTOM_OPTIONS.map(({ key, label }) => (
          <SymptomChip key={key} label={label} level={symptomLevel(symptoms, key)} onTap={() => tap(key, label)} showLevel />
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button fullWidth loading={saving} disabled={!changed} onClick={onSave}>
        {saveLabel(symptoms.length)}
      </Button>
    </div>
  );
}
