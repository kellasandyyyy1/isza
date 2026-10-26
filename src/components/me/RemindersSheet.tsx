"use client";

import { IconBell, IconPencil, IconPlus } from "@tabler/icons-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Switch } from "@/components/ui/Switch";
import { deleteReminder, updateReminder } from "@/db/repo";
import type { Reminder } from "@/db/schema";
import { daysSummary } from "@/lib/reminders";
import { PushSection } from "@/components/push/PushSection";
import { ConfirmDeleteView } from "./ConfirmDeleteView";
import { ReminderEditor } from "./ReminderEditor";

interface RemindersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminders: Reminder[];
  discreet: boolean;
}

type View = { name: "list" } | { name: "edit"; reminder: Reminder | null } | { name: "delete"; reminder: Reminder };

// Reminders are kept and shown in the app for now. Notifications come in a later step.
export function RemindersSheet({ open, onOpenChange, reminders, discreet }: RemindersSheetProps) {
  const headingId = useId();
  const [view, setView] = useState<View>({ name: "list" });
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current && view.name !== "list") document.getElementById(headingId)?.focus();
  }, [view, headingId]);

  const goTo = (next: View) => {
    moved.current = true;
    setView(next);
  };
  const changeOpen = (next: boolean) => {
    if (!next) setView({ name: "list" });
    onOpenChange(next);
  };

  return (
    <ResponsiveSheet open={open} onOpenChange={changeOpen} title="Reminders">
      {view.name === "edit" ? (
        <ReminderEditor
          headingId={headingId}
          reminder={view.reminder}
          discreet={discreet}
          onDone={() => goTo({ name: "list" })}
          onDelete={() => view.reminder && goTo({ name: "delete", reminder: view.reminder })}
        />
      ) : view.name === "delete" ? (
        <ConfirmDeleteView
          headingId={headingId}
          title="Delete this reminder?"
          text={`This deletes the reminder "${view.reminder.label}" at ${view.reminder.time}.`}
          confirmLabel="Delete reminder"
          backLabel="Back to reminder"
          onConfirm={async () => {
            if (view.reminder.id !== undefined) await deleteReminder(view.reminder.id);
            goTo({ name: "list" });
          }}
          onCancel={() => goTo({ name: "edit", reminder: view.reminder })}
        />
      ) : reminders.length === 0 ? (
        <>
          <PushSection discreet={discreet} />
          <EmptyState
            icon={IconBell}
            mascot={{ pose: "me" }}
            title="No reminders yet"
            text="Add a nudge for your pill, supplements or check-in."
            action={{ label: "Add reminder", icon: IconPlus, onClick: () => goTo({ name: "edit", reminder: null }) }}
          />
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <PushSection discreet={discreet} />
          <ul aria-label="Your reminders" className="flex flex-col divide-y divide-line">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-center gap-2 py-1">
                <div className="min-w-0 flex-1">
                  <Switch
                    label={reminder.label}
                    description={`${reminder.time}, ${daysSummary(reminder.days)}`}
                    checked={reminder.enabled}
                    onCheckedChange={(enabled) => reminder.id !== undefined && void updateReminder(reminder.id, { enabled })}
                  />
                </div>
                <IconButton icon={IconPencil} aria-label={`Edit ${reminder.label}`} onClick={() => goTo({ name: "edit", reminder })} />
              </li>
            ))}
          </ul>
          <Button fullWidth variant="secondary" icon={IconPlus} onClick={() => goTo({ name: "edit", reminder: null })}>
            Add reminder
          </Button>
        </div>
      )}
    </ResponsiveSheet>
  );
}
