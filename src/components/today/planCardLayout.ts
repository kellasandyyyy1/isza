// Shared by the five plan cards and the Water card, so all six match.

// One height for every card: 164px, taller when the screen allows. That fits the 36px icon row, two phase lines
// and two note lines inside 16px padding and the card's 1px border. Under 700px tall the carousel shows title
// rows, and on a crowded Today too (see PlanCardRoom); there every card keeps the height of its row instead.
// 16px padding on all four sides, on every card.
export const PLAN_CARD_FRAME = "relative overflow-hidden p-4! h-[max(164px,19dvh)]";
export const PLAN_CARD_COMPACT = "[@media(max-height:699px)]:h-auto [@media(max-height:699px)]:py-2!";
export const PLAN_CARD_TITLE_ONLY = "h-auto! py-2!";
// One extra row on Today (the period pill alone, for example): full cards wherever they fit beside it, measured
// from 720px tall on phones under 380px wide (the ring is smaller there) and from 820px tall on wider ones. A
// title row below that, so Today still never scrolls.
export const PLAN_CARD_TITLE_ONLY_WHEN_TIGHT =
  "[@media(max-height:719px)]:h-auto! [@media(max-height:719px)]:py-2! [@media(max-height:819px)_and_(min-width:380px)]:h-auto! [@media(max-height:819px)_and_(min-width:380px)]:py-2!";
export const HIDE_WHEN_TIGHT = "[@media(max-height:719px)]:hidden [@media(max-height:819px)_and_(min-width:380px)]:hidden";

export type { PlanCardRoom } from "@/lib/today";

// The phase line and the daily note: two lines each at most, with an ellipsis. They never shrink, so a line is
// never cut through the middle without one.
export const PLAN_CARD_PHASE_LINE = "shrink-0 line-clamp-2 text-small text-ink-muted";
export const PLAN_CARD_NOTE_LINE = "shrink-0 line-clamp-2 text-caption text-ink-muted";
// Under 700px tall a compact card is a title row only.
export const HIDE_WHEN_SHORT = "[@media(max-height:699px)]:hidden";
