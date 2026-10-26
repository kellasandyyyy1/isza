"use client";

import { IconBell } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DEVICE_ID_KEY, getDeviceSetting } from "@/db/repo";

// Development only. Turn on "Notifications on this device" in Me > Reminders first.
export function SendTestPushButton({ onResult }: { onResult: (message: string) => void }) {
  const [sending, setSending] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  async function send() {
    setSending(true);
    try {
      const deviceId = await getDeviceSetting(DEVICE_ID_KEY);
      if (!deviceId) {
        onResult("Turn on notifications in Me > Reminders first");
        return;
      }
      const response = await fetch("/api/push/dev-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      onResult(response.ok ? "Test push sent" : `Test push failed (${response.status})`);
    } catch {
      onResult("Test push failed: no connection");
    } finally {
      setSending(false);
    }
  }

  return (
    <Button variant="secondary" icon={IconBell} loading={sending} onClick={() => void send()}>
      Send test push to this device
    </Button>
  );
}
