import { DAILY_NOTES, type DailyNote, type DailyNoteCard } from "@/content/daily-notes";
import type { Phase } from "./cycle";
import { getGuidance, warnFallback } from "./guidance";
import { hashString } from "./hash";

// The notes a card can show: unrestricted ones, plus the ones for the current phase. Without a phase
// (hormonal, irregular, no data) only the unrestricted ones.
export function eligibleNotes(card: DailyNoteCard, phase: Phase | null): DailyNote[] {
  return DAILY_NOTES[card].filter((note) => (phase === null ? !note.phases : !note.phases || note.phases.includes(phase)));
}

const dayNumber = (isoDate: string) => Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);

// Today's note for a card. The same all day and after a reload, different per card, and a new one each day.
// Each card's notes are put in a fixed order by hashing the card name with each note's id, the card name's hash
// sets where each card starts, and the date moves it one step a day. So days in a row never repeat a note until
// every eligible note has shown, which a plain hash of each date cannot promise.
// Never undefined: an empty pool for the phase falls back to the card's unrestricted notes.
export function getDailyNote(card: DailyNoteCard, today: string, phase: Phase | null): DailyNote {
  let pool = Object.hasOwn(DAILY_NOTES, card) ? eligibleNotes(card, phase) : [];
  if (pool.length === 0) {
    warnFallback(`No "${card}" daily notes for phase "${phase ?? "none"}". Using the unrestricted notes instead.`);
    pool = Object.hasOwn(DAILY_NOTES, card) ? eligibleNotes(card, null) : [];
  }
  // Only reachable if a card had no unrestricted notes at all, which the content tests rule out.
  if (pool.length === 0) return { id: "fallback", text: getGuidance(null, "energy") };
  const order = [...pool].sort((a, b) => hashString(`${card}:${a.id}`) - hashString(`${card}:${b.id}`));
  const start = hashString(card);
  return order[(dayNumber(today) + start) % order.length];
}
