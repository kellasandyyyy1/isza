"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { Switch } from "@/components/ui/Switch";
import { findValidationCard } from "@/components/validation/findValidationCard";
import { ValidationCard } from "@/components/validation/ValidationCard";
import { getValidationSettings, saveCheckIn, saveValidationSettings } from "@/db/repo";
import type { DailyLog, Period } from "@/db/schema";
import {
  checkInSchema,
  draftFromLog,
  isToggleInitiallyOn,
  periodChangeFor,
  periodToggleFor,
  type CheckInDraft,
} from "@/lib/checkin";
import {
  recordValidationDismissed,
  recordValidationShown,
  type ValidationCard as ValidationCardData,
} from "@/lib/validation";
import { BleedingPicker } from "./BleedingPicker";
import { DetailsView } from "./DetailsView";
import { EnergyPicker } from "./EnergyPicker";
import { MoodPicker } from "./MoodPicker";
import { RemovePeriodView } from "./RemovePeriodView";
import { RowButton } from "./RowButton";
import { SymptomShortcutView } from "./SymptomShortcutView";
import { SymptomsView } from "./SymptomsView";

type View = "main" | "symptoms" | "details" | "remove-period";

// Matches the mascot cheer, so it plays before the sheet closes.
const CHEER_MS = 600;
// A supportive note keeps the sheet open until she dismisses it or taps anywhere, at most this long.
const NOTE_MAX_MS = 8000;

interface CheckInFormProps {
  date: string;
  today: string;
  log: DailyLog | null;
  periods: Period[];
  onSaved: () => void;
  // "symptoms" opens straight on the Symptoms view, from the symptom shortcut on Today.
  startView?: "main" | "symptoms";
}

// Pre-filled from the existing log. Extra inputs are views inside the same sheet, never a second modal.
export function CheckInForm({ date, today, log, periods, onSaved, startView = "main" }: CheckInFormProps) {
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
  // Opened from the "+" on Today: only the symptoms, saved without the rest of the check-in.
  const shortcut = startView === "symptoms";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cheerKey, setCheerKey] = useState(0);
  // Set after a successful save when today's log matches a supportive note.
  const [note, setNote] = useState<ValidationCardData | null>(null);
  const reduced = useReducedMotion() === true;
  const focusTarget = useRef<string | null>(null);

  // Moves focus to the new view's heading, or back to the button that opened it.
  useEffect(() => {
    if (focusTarget.current) document.getElementById(focusTarget.current)?.focus();
  }, [view]);

  // The latest onSaved, so a parent re-render does not restart the note's timer.
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  // Once the note shows: remember the day it showed, and close the sheet after 8 seconds at most.
  useEffect(() => {
    if (!note) return;
    void getValidationSettings().then((settings) => saveValidationSettings(recordValidationShown(settings, today)));
    const timer = setTimeout(() => onSavedRef.current(), NOTE_MAX_MS);
    return () => clearTimeout(timer);
  }, [note, today]);

  async function dismissNote() {
    await saveValidationSettings(recordValidationDismissed(await getValidationSettings()));
    onSaved();
  }

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
      const saved = await saveCheckIn({ date, ...parsed.data }, change);
      // The shortcut has no mascot on screen, so it does not wait for her cheer.
      if (!reduced && !shortcut) {
        setCheerKey((key) => key + 1);
        await new Promise((resolve) => setTimeout(resolve, CHEER_MS));
      }
      // A note never blocks the save: if finding one fails, the sheet just closes.
      const found = await findValidationCard(saved, today).catch(() => null);
      if (found) {
        setSaving(false);
        setNote(found);
        return;
      }
      onSaved();
    } catch {
      setError("Something went wrong while saving. Please try again.");
      setSaving(false);
      if (!shortcut) setView("main");
    }
  }

  // The rest of today's log is saved as it was; only the symptoms change.
  if (shortcut && !note) {
    return (
      <SymptomShortcutView
        symptoms={draft.symptoms}
        savedSymptoms={log?.symptoms ?? []}
        onChange={(symptoms) => update({ symptoms })}
        onSave={() => void save()}
        saving={saving}
        error={error}
      />
    );
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
        date={date}
        isToday={date === today}
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

  // Saved, with a supportive note: the inputs give way to the note above the button, so it is never below
  // the fold. A tap anywhere closes the sheet; Dismiss stops its own tap from getting here.
  if (note) {
    return (
      <div className="flex flex-col gap-3" onClick={onSaved}>
        <ValidationCard card={note} onDismiss={() => void dismissNote()} />
        <Button fullWidth>Done</Button>
      </div>
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
