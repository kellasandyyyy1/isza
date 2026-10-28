"use client";

import { useEffect, useState } from "react";
import { useLogs, usePeriods, useProfile, useReminders, useWaterSettings } from "@/db/hooks";
import { buildSyncBody, getDeviceId, localTimeZone, syncIfChanged } from "@/lib/push-client";
import { refreshPushSubscribed, setPushStatus, usePushStatus } from "./pushStatus";

const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };
const DEBOUNCE_MS = 1000;

// While push is on, keeps the server's reminder schedule in step with this device, one second
// after reminders, discreet mode, periods, check-ins or the water settings change. Coming back to the app or back
// online checks again, which also catches a new time zone. Renders nothing.
export function PushSync() {
  const { subscribed } = usePushStatus();
  const reminders = useReminders();
  const profile = useProfile();
  const periods = usePeriods();
  const logs = useLogs(ALL_DATES.from, ALL_DATES.to);
  const water = useWaterSettings();
  const [nudge, setNudge] = useState(0);

  useEffect(() => {
    void refreshPushSubscribed();
    const again = () => {
      if (!document.hidden) setNudge((count) => count + 1);
    };
    window.addEventListener("online", again);
    document.addEventListener("visibilitychange", again);
    return () => {
      window.removeEventListener("online", again);
      document.removeEventListener("visibilitychange", again);
    };
  }, []);

  useEffect(() => {
    if (
      subscribed !== true ||
      reminders === undefined ||
      profile === undefined ||
      periods === undefined ||
      logs === undefined ||
      water === undefined
    ) {
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        const body = buildSyncBody({
          deviceId: await getDeviceId(),
          timezone: localTimeZone(),
          profile,
          reminders,
          periods,
          logs,
          water,
          now: new Date(),
        });
        setPushStatus({ pending: (await syncIfChanged(body)) === "offline" });
      })();
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [subscribed, reminders, profile, periods, logs, water, nudge]);

  return null;
}
