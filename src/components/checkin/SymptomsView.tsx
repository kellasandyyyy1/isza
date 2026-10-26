import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SymptomEntry } from "@/db/schema";
import { SYMPTOM_LEVEL_NAMES, cycleSymptom, symptomLevel } from "@/lib/checkin";
import { SYMPTOM_OPTIONS } from "./checkinConfig";
import { SymptomChip } from "./SymptomChip";
import { ViewHeader } from "./ViewHeader";

interface SymptomsViewProps {
  headingId: string;
  symptoms: SymptomEntry[];
  onChange: (symptoms: SymptomEntry[]) => void;
  onDone: () => void;
}

export function SymptomsView({ headingId, symptoms, onChange, onDone }: SymptomsViewProps) {
  const [announcement, setAnnouncement] = useState("");

  function tap(key: SymptomEntry["key"], label: string) {
    const next = cycleSymptom(symptoms, key);
    onChange(next);
    setAnnouncement(`${label}: ${SYMPTOM_LEVEL_NAMES[symptomLevel(next, key)]}`);
  }

  return (
    <div>
      <ViewHeader id={headingId} title="Symptoms" onBack={onDone} />
      <p className="mb-3 text-small text-ink-muted">Tap to switch between mild, moderate, severe and off.</p>
      <div role="group" aria-labelledby={headingId} className="grid grid-cols-3 gap-2">
        {SYMPTOM_OPTIONS.map(({ key, label }) => (
          <SymptomChip key={key} label={label} level={symptomLevel(symptoms, key)} onTap={() => tap(key, label)} />
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Button fullWidth className="mt-4" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
