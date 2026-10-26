"use client";

import { IconDatabaseImport } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const CONFIRM_MESSAGE =
  "Load demo data? This deletes your profile, periods, daily logs, workouts, supplies, reminders, dismissed flags and settings on this device.";

export function LoadDemoDataButton({ onLoaded }: { onLoaded: () => void }) {
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  async function load() {
    if (!window.confirm(CONFIRM_MESSAGE)) return;
    setLoading(true);
    try {
      const { loadDemoData } = await import("@/dev/seed");
      await loadDemoData();
      onLoaded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" icon={IconDatabaseImport} loading={loading} onClick={() => void load()}>
      Load demo data
    </Button>
  );
}
