"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { Switch } from "@/components/ui/Switch";
import { saveCheckIn } from "@/db/repo";
import type { DailyLog, Period } from "@/db/schema";
import {
  checkInSchema,
  draftFromLog,
  isToggleInitiallyOn,
  periodChangeFor,
  periodToggleFor,
  type CheckInDraft,
} from "@/lib/checkin";
import { BleedingPicker } from "./BleedingPicker";
import { DetailsView } from "./DetailsView";
import { EnergyPicker } from "./EnergyPicker";
import { MoodPicker } from "./MoodPicker";
import { RemovePeriodView } from "./RemovePeriodView";
import { RowButton } from "./RowButton";
import { SymptomsView } from "./SymptomsView";

type View = "main" | "symptoms" | "details" | "remove-period";

// Matches the mascot cheer, so it plays before the sheet closes.
const CHEER_MS = 600;

interface CheckInFormProps {
  date: string;
  today: string;
  log: DailyLog | null;
  periods: Period[];
  onSaved: () => void;
}

// Pre-filled from the existing log. Extra inputs are views inside the same sheet, never a second modal.
export function CheckInForm({ date, today, log, periods, onSaved }: CheckInFormProps) {
  const baseId = useId();
  const ids = {
    symptomsButton: `${baseId}-symptoms-button`,
    detailsButton: `${baseId}-details-button`,
    viewHeading: `${baseId}-view-heading`,
  };
  const [draft, setDraft] = useState<CheckInDraft>(() => draftFromLog(log));
  const [toggle] = useState(() => periodToggleFor(periods, date));
  const [periodOn, setPeriodOn] = useState(() => isToggleInitiallyOn(toggle));
  const [view, setView] = useState<View>("main");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cheerKey, setCheerKey] = useState(0);
  const reduced = useReducedMotion() === true;
  const focusTarget = useRef<string | null>(null);

  // Moves focus to the new view's heading, or back to the button that opened it.
  useEffect(() => {
    if (focusTarget.current) document.getElementById(focusTarget.current)?.focus();
  }, [view]);

  function goTo(next: View, focusId: string) {
    focusTarget.current = focusId;
    setView(next);
  }

  const update = (patch: Partial<CheckInDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const change = periodChangeFor(toggle, periodOn, date);
  const dayWord = date === today ? "today" : "this day";
  const switchLabel = toggle.kind === "start" ? `My period started ${dayWord}` : `My period ended ${dayWord}`;

  async function save() {
    const parsed = checkInSchema.safeParse(draft);
    if (!parsed.success) {
      setError("Some details need a look before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveCheckIn({ date, ...parsed.data }, change);
      if (!reduced) {
        setCheerKey((key) => key + 1);
        await new Promise((resolve) => setTimeout(resolve, CHEER_MS));
      }
      onSaved();
    } catch {
      setError("Something went wrong while saving. Please try again.");
      setSaving(false);
      setView("main");
    }
  }

  if (view === "symptoms") {
    return (
      <SymptomsView
        headingId={ids.viewHeading}
        symptoms={draft.symptoms}
        onChange={(symptoms) => update({ symptoms })}
        onDone={() => goTo("main", ids.symptomsButton)}
      />
    );
  }

  if (view === "details") {
    return (
      <DetailsView
        headingId={ids.viewHeading}
        draft={draft}
        onChange={update}
        onDone={() => goTo("main", ids.detailsButton)}
      />
    );
  }

  if (view === "remove-period") {
    return (
      <RemovePeriodView
        headingId={ids.viewHeading}
        date={date}
        saving={saving}
        onConfirm={() => void save()}
        onKeep={() => {
          setPeriodOn(true);
          goTo("main", ids.symptomsButton);
        }}
      />
    );
  }

  const symptomCount = draft.symptoms.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden under 700px tall: there she would push the sheet into scrolling. */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Switch label={switchLabel} checked={periodOn} onCheckedChange={setPeriodOn} />
        </div>
        <MascotSlot pose="checkin" size="sm" cheerKey={cheerKey} className="[@media(max-height:699px)]:hidden" />
      </div>
      <BleedingPicker value={draft.bleeding} onChange={(bleeding) => update({ bleeding })} />
      <EnergyPicker value={draft.energy} onChange={(energy) => update({ energy })} />
      <MoodPicker value={draft.mood} onChange={(mood) => update({ mood })} />
      <div className="grid grid-cols-2 gap-2">
        <RowButton
          id={ids.symptomsButton}
          label="Symptoms"
          detail={symptomCount > 0 ? `(${symptomCount})` : undefined}
          onClick={() => goTo("symptoms", ids.viewHeading)}
        />
        <RowButton id={ids.detailsButton} label="More details" onClick={() => goTo("details", ids.viewHeading)} />
      </div>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button
        fullWidth
        loading={saving}
        onClick={() => (change.type === "remove" ? goTo("remove-period", ids.viewHeading) : void save())}
      >
        Save check-in
      </Button>
    </div>
  );
}
