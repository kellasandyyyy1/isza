"use client";

import { useId } from "react";
import { MeGroup } from "@/components/me/MeGroup";
import { usePushStatus } from "@/components/push/pushStatus";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { saveWaterSettings } from "@/db/repo";
import { useWaterSettings } from "@/db/hooks";
import { waterReminderTimes, type WaterInterval, type WaterSettings } from "@/lib/water";

const INTERVALS = { "2": 2, "3": 3, "4": 4 } as const satisfies Record<string, WaterInterval>;
type IntervalKey = keyof typeof INTERVALS;

const timeFieldClasses =
  "h-11 w-full rounded-input border-2 border-transparent bg-surface-2 px-3 text-body text-ink focus-visible:border-ink";

// The Water section in Me: reminders only, off to start. The tally on Today is always on. Settings has no mascot: she is on the Water card on Today.
export function WaterSettingsSection() {
  const settings = useWaterSettings();
  const { subscribed } = usePushStatus();
  const ids = { start: useId(), end: useId(), windowHint: useId() };
  if (!settings) return null;

  const save = (patch: Partial<WaterSettings>) => void saveWaterSettings({ ...settings, ...patch });
  const remindersOn = settings.waterRemindersEnabled;
  const times = waterReminderTimes(settings.waterWindowStart, settings.waterWindowEnd, settings.waterIntervalHours);

  return (
    <MeGroup title="Water">
      <li className="px-4 py-1">
        <Switch
          label="Water reminders"
          description="A gentle nudge during the day. Quiet if you just logged a glass."
          checked={remindersOn}
          onCheckedChange={(waterRemindersEnabled) => save({ waterRemindersEnabled })}
        />
        {remindersOn && subscribed !== true && (
          <p className="pb-2 text-small text-ink-muted">Turn on notifications to get these when the app is closed.</p>
        )}
      </li>
      {remindersOn && (
        <li className="flex flex-col gap-3 px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={ids.start} className="mb-1.5 block text-small text-ink-muted">
                From
              </label>
              <input
                id={ids.start}
                type="time"
                value={settings.waterWindowStart}
                onChange={(event) => event.target.value && save({ waterWindowStart: event.target.value })}
                aria-describedby={ids.windowHint}
                className={timeFieldClasses}
              />
            </div>
            <div>
              <label htmlFor={ids.end} className="mb-1.5 block text-small text-ink-muted">
                To
              </label>
              <input
                id={ids.end}
                type="time"
                value={settings.waterWindowEnd}
                onChange={(event) => event.target.value && save({ waterWindowEnd: event.target.value })}
                aria-describedby={ids.windowHint}
                className={timeFieldClasses}
              />
            </div>
          </div>
          <SegmentedControl<IntervalKey>
            aria-label="Remind me every"
            value={String(settings.waterIntervalHours) as IntervalKey}
            onValueChange={(key) => save({ waterIntervalHours: INTERVALS[key] })}
            options={[
              { value: "2", label: "2 hours" },
              { value: "3", label: "3 hours" },
              { value: "4", label: "4 hours" },
            ]}
          />
          <p id={ids.windowHint} className="text-small text-ink-muted">
            {times.length > 0 ? `At ${times.join(", ")}.` : "Pick an end time after the start time."}
          </p>
        </li>
      )}
      <li className="px-4 py-3">
        <p className="text-small text-ink-muted">Reminders only. Iszacycle does not set a daily target.</p>
      </li>
    </MeGroup>
  );
}
