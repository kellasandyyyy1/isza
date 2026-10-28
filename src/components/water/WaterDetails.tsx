"use client";

import { waterNote } from "@/content/guidance";
import { changeWaterCount } from "@/db/repo";
import { useLogs, usePeriods, useProfile, useWaterLog } from "@/db/hooks";
import { computeCycleState } from "@/lib/cycle";
import { WaterRow } from "./WaterRow";

const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

// The water tally in the check-in details, for today only.
// Each tap saves at once, on its own: the tally never waits for the rest of the check-in.
export function WaterDetails({ today }: { today: string }) {
  const log = useWaterLog(today);
  const profile = useProfile();
  const periods = usePeriods();
  const logs = useLogs(ALL_DATES.from, ALL_DATES.to);

  if (log === undefined) return null;
  const phase =
    profile === undefined || periods === undefined || logs === undefined
      ? null
      : computeCycleState({ periods, profile, logs, today }).phase;
  const note = waterNote[phase ?? "neutral"];

  return (
    <div className="flex flex-col gap-1">
      <WaterRow
        count={log?.count ?? 0}
        onAdd={() => void changeWaterCount(today, 1)}
        onRemove={() => void changeWaterCount(today, -1)}
      />
      {note && <p className="pl-8 text-small text-ink-muted">{note}</p>}
    </div>
  );
}
