"use client";

import { useId, useState } from "react";
import { GroupLabel } from "@/components/checkin/GroupLabel";
import { ViewHeader } from "@/components/checkin/ViewHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { addReminder, updateReminder } from "@/db/repo";
import type { Reminder } from "@/db/schema";
import { REMINDER_TYPE_LABELS, WEEKDAYS, reminderFormSchema, reminderText, type ReminderType } from "@/lib/reminders";

interface ReminderEditorProps {
  headingId: string;
  reminder: Reminder | null;
  discreet: boolean;
  onDone: () => void;
  onDelete: () => void;
}

const TYPES = Object.entries(REMINDER_TYPE_LABELS) as [ReminderType, string][];
const fieldClasses = "h-12 w-full rounded-input bg-surface-2 px-4 text-body text-ink";

export function ReminderEditor({ headingId, reminder, discreet, onDone, onDelete }: ReminderEditorProps) {
  const ids = { type: useId(), label: useId(), time: useId(), days: useId(), error: useId() };
  const [type, setType] = useState<ReminderType>(reminder?.type ?? "check-in");
  const [label, setLabel] = useState(reminder?.label ?? REMINDER_TYPE_LABELS["check-in"]);
  const [time, setTime] = useState(reminder?.time ?? "20:00");
  const [days, setDays] = useState<number[]>(reminder?.days ?? WEEKDAYS.map((day) => day.value));
  const [saving, setSaving] = useState(false);

  const draft = { type, label: label.trim(), time, days, enabled: reminder?.enabled ?? true };
  const parsed = reminderFormSchema.safeParse(draft);
  const error = parsed.success ? null : (parsed.error.issues[0]?.message ?? "Check the details.");

  function changeType(next: ReminderType) {
    // Keep a name the user typed; replace one that was only the type's default.
    if (label === REMINDER_TYPE_LABELS[type]) setLabel(REMINDER_TYPE_LABELS[next]);
    setType(next);
  }

  async function save() {
    if (!parsed.success) return;
    setSaving(true);
    try {
      if (reminder?.id !== undefined) await updateReminder(reminder.id, parsed.data);
      else await addReminder(parsed.data);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewHeader id={headingId} title={reminder ? "Edit reminder" : "New reminder"} onBack={onDone} backLabel="Back to reminders" />

      <div>
        <GroupLabel id={ids.type}>Type</GroupLabel>
        <div role="group" aria-labelledby={ids.type} className="flex flex-wrap gap-2">
          {TYPES.map(([value, typeLabel]) => (
            <Chip key={value} selected={type === value} onClick={() => changeType(value)}>
              {typeLabel}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={ids.label} className="mb-1.5 block text-small text-ink-muted">
          Name
        </label>
        <input id={ids.label} type="text" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} className={fieldClasses} />
      </div>

      <div>
        <label htmlFor={ids.time} className="mb-1.5 block text-small text-ink-muted">
          Time
        </label>
        <input id={ids.time} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={fieldClasses} />
      </div>

      <div>
        <GroupLabel id={ids.days}>Days</GroupLabel>
        <div role="group" aria-labelledby={ids.days} className="grid grid-cols-4 gap-2">
          {WEEKDAYS.map((day) => (
            <Chip
              key={day.value}
              size="compact"
              aria-label={day.long}
              selected={days.includes(day.value)}
              onClick={() =>
                setDays((current) =>
                  current.includes(day.value) ? current.filter((value) => value !== day.value) : [...current, day.value],
                )
              }
            >
              {day.short}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-small text-ink-muted">
        Shows as: &ldquo;{reminderText(draft, discreet)}&rdquo;
        {discreet && " (discreet mode)"}
      </p>
      {error && (
        <p id={ids.error} role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button fullWidth disabled={!parsed.success} loading={saving} onClick={() => void save()}>
        Save reminder
      </Button>
      {reminder && (
        <Button fullWidth variant="ghost" disabled={saving} onClick={onDelete}>
          Delete reminder
        </Button>
      )}
    </div>
  );
}
