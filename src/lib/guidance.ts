import { guidance, type GuidanceEntry, type GuidanceKey } from "@/content/guidance";
import type { Phase } from "./cycle";

export type GuidanceCard = keyof GuidanceEntry;

// Warns in development only, so a missing entry is noticed while building and never logs for real users.
export function warnFallback(message: string): void {
  if (process.env.NODE_ENV === "development") console.warn(`[iszacycle] ${message}`);
}

// The phase sentence for a plan card. Never empty: when the phase has no entry, or the entry has no text for this
// card, it falls back to the "neutral" entry.
export function getGuidance(phase: Phase | GuidanceKey | null, card: GuidanceCard): string {
  const key: GuidanceKey = phase ?? "neutral";
  const text = Object.hasOwn(guidance, key) ? guidance[key][card] : undefined;
  if (typeof text === "string" && text.trim() !== "") return text;
  warnFallback(`No "${card}" guidance for phase "${key}". Showing the neutral line instead.`);
  return guidance.neutral[card];
}
