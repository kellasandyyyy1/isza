import { exportDataSchema, type ExportData } from "@/db/schema";

export function backupFileName(today: string): string {
  return `isza-backup-${today}.json`;
}

export type BackupCheck =
  | {
      ok: true;
      data: ExportData;
      counts: { periods: number; checkIns: number; workouts: number; supplies: number; reminders: number };
    }
  | { ok: false; error: string };

// Validates a backup file's text before anything on the device is touched.
export function parseBackup(text: string): BackupCheck {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not a valid backup file." };
  }
  const parsed = exportDataSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "This file is not an Isza backup, or it is damaged." };
  const data = parsed.data;
  return {
    ok: true,
    data,
    counts: {
      periods: data.periods.length,
      checkIns: data.dailyLogs.length,
      workouts: data.workouts.length,
      supplies: data.supplies.length,
      reminders: data.reminders.length,
    },
  };
}
