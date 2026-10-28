"use client";

import { IconBell } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useAppLockControls } from "@/components/lock/AppLockProvider";
import { Toast } from "@/components/ui/Toast";
import {
  getProfile,
  getRemindersCheckedAt,
  getWaterLog,
  getWaterSettings,
  listReminders,
  setRemindersCheckedAt,
} from "@/db/repo";
import { dueReminders, reminderText } from "@/lib/reminders";
import {
  WATER_REMINDER_DISCREET_TEXT,
  WATER_REMINDER_TEXT,
  latestDueWaterReminder,
  localDateKey,
  shouldSuppressWaterReminder,
} from "@/lib/water";

// When the app opens (and once it is unlocked), shows each reminder that came due in the
// last 12 hours as a toast, one after another. The check time is saved so none repeats.
// Water reminders work here too, so they reach her in the app even with notifications off.
export function DueReminderToasts() {
  const { covered } = useAppLockControls();
  const [queue, setQueue] = useState<{ id: number; text: string }[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (covered || started.current) return;
    started.current = true;
    void (async () => {
      const now = new Date();
      const [reminders, profile, since, water, waterLog] = await Promise.all([
        listReminders(),
        getProfile(),
        getRemindersCheckedAt(),
        getWaterSettings(),
        getWaterLog(localDateKey(now)),
      ]);
      // No profile (not set up, or everything was just deleted): nothing to remind, nothing to store.
      if (!profile) return;
      await setRemindersCheckedAt(now);
      const discreet = profile?.discreetMode ?? false;
      const texts = dueReminders(reminders, now, since).map(({ reminder }) => reminderText(reminder, discreet));
      // At most one water reminder, however many times passed, and none right after a glass was logged.
      if (latestDueWaterReminder(water, now, since) && !shouldSuppressWaterReminder(waterLog, now)) {
        texts.push(discreet ? WATER_REMINDER_DISCREET_TEXT : WATER_REMINDER_TEXT);
      }
      setQueue(texts.map((text, id) => ({ id, text })));
    })();
  }, [covered]);

  const current = queue[0];
  return (
    <Toast
      // A new key per reminder restarts the timer, even when two texts are the same.
      key={current?.id ?? "none"}
      icon={IconBell}
      message={current?.text ?? ""}
      open={current !== undefined}
      onOpenChange={(open) => !open && setQueue((items) => items.slice(1))}
    />
  );
}
