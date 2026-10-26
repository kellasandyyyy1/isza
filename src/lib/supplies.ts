import type { Supply } from "@/db/schema";
import { daysBetween, type CycleState } from "./cycle";

export type SupplyKind = Supply["kind"];

export const SUPPLY_KIND_LABELS: Record<SupplyKind, string> = {
  pads: "Pads",
  tampons: "Tampons",
  liners: "Liners",
  cup: "Cup",
  painkillers: "Painkillers",
  other: "Other",
};

// The Today chip shows when the next period is predicted within this many days.
export const SUPPLY_ALERT_DAYS = 5;

export function isLow(supply: Supply): boolean {
  return supply.count <= supply.lowAt;
}

// "Running low on [label]" for the first low supply, only when a period is predicted within 5 days.
export function lowSupplyAlert(cycle: CycleState, supplies: Supply[], today: string): string | null {
  if (!cycle.nextPeriod) return null;
  const daysAway = daysBetween(today, cycle.nextPeriod.start);
  if (daysAway < 0 || daysAway > SUPPLY_ALERT_DAYS) return null;
  const low = supplies.find(isLow);
  return low ? `Running low on ${low.label}` : null;
}
