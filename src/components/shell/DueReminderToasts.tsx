"use client";

import { IconBell } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useAppLockControls } from "@/components/lock/AppLockProvider";
import { Toast } from "@/components/ui/Toast";
import { getProfile, getRemindersCheckedAt, listReminders, setRemindersCheckedAt } from "@/db/repo";
import { dueReminders, reminderText } from "@/lib/reminders";

// When the app opens (and once it is unlocked), shows each reminder that came due in the
// last 12 hours as a toast, one after another. The check time is saved so none repeats.
export function DueReminderToasts() {
  const { covered } = useAppLockControls();
  const [queue, setQueue] = useState<{ id: number; text: string }[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (covered || started.current) return;
    started.current = true;
    void (async () => {
      const now = new Date();
      const [reminders, profile, since] = await Promise.all([listReminders(), getProfile(), getRemindersCheckedAt()]);
      // No profile (not set up, or everything was just deleted): nothing to remind, nothing to store.
      if (!profile) return;
      await setRemindersCheckedAt(now);
      const discreet = profile?.discreetMode ?? false;
      setQueue(dueReminders(reminders, now, since).map(({ reminder }, id) => ({ id, text: reminderText(reminder, discreet) })));
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
