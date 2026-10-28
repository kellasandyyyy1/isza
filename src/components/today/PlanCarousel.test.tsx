import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { DailyNoteCard } from "@/content/daily-notes";
import { shiftDate } from "@/lib/cycle";
import { getDailyNote } from "@/lib/daily-notes";
import { buildOnboardingRecords, initialOnboardingAnswers } from "@/lib/onboarding";
import { buildTodayView, planCardRoom } from "@/lib/today";
import { PlanCarousel } from "./PlanCarousel";

// jsdom has no ResizeObserver; the cards only use it to show the "more" chevron.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(cleanup);

const NOW = new Date(2026, 9, 27, 9, 0);
const TODAY = "2026-10-27";

// A profile straight out of onboarding, one period starting `daysAgo` days ago, and no check-ins.
function freshView(daysAgo: number, periodLength: number) {
  const { profile, period } = buildOnboardingRecords(
    {
      ...initialOnboardingAnswers,
      goals: ["train"],
      lastPeriodStart: shiftDate(TODAY, -daysAgo),
      periodLength,
      contraception: "none",
      activityLevel: "moderate",
      privacyAccepted: true,
    },
    TODAY,
    NOW.toISOString(),
  );
  if (!period) throw new Error("Onboarding saved no period.");
  return buildTodayView({ profile, periods: [{ ...period, id: 1 }], logs: [], dismissedFlags: [], now: NOW });
}

function renderCarousel(view: ReturnType<typeof freshView>) {
  const note = (card: DailyNoteCard) => getDailyNote(card, view.today, view.cycle.phase).text;
  // The same extra-row count as Today: here only the period pill can show.
  const room = planCardRoom(view.periodAction ? 1 : 0);
  render(
    <PlanCarousel
      guidanceKey={view.guidanceKey}
      onOpen={() => {}}
      room={room}
      notes={{ train: note("train"), food: note("food"), energy: note("energy"), sleep: note("sleep"), social: note("social") }}
      water={{ count: 0, note: note("water"), onAdd: () => {}, onOpen: () => {} }}
    />,
  );
  return room;
}

describe("a freshly onboarded user, one period, no check-ins", () => {
  // Day 5 of a 6 day usual period: still open, so the "Period ended today?" pill shows. That is the reported bug.
  for (const [label, daysAgo, periodLength] of [
    ["day 5, period still open", 4, 6],
    ["day 5, period closed", 4, 5],
    ["day 12", 11, 5],
  ] as const) {
    it(`${label}: all six cards show a full body`, () => {
      const view = freshView(daysAgo, periodLength);
      const room = renderCarousel(view);
      // Full bodies are rendered, never title rows only.
      expect(room).not.toBe("heavy");

      const carousel = screen.getByRole("region", { name: "Today's plan" });
      const cards = within(carousel).getAllByRole("heading", { level: 2 }).map((heading) => heading.closest(".rounded-card"));
      expect(cards).toHaveLength(6);
      for (const card of cards) {
        if (!(card instanceof HTMLElement)) throw new Error("A card is missing its frame.");
        const lines = Array.from(card.querySelectorAll("p")).map((line) => line.textContent?.trim() ?? "");
        // Two lines under the title on every card, none of them empty.
        expect(lines.length, card.textContent ?? "").toBeGreaterThanOrEqual(2);
        for (const line of lines) expect(line, card.textContent ?? "").not.toBe("");
      }
    });
  }

  it("day 5 is menstrual, so the cards use the menstrual lines", () => {
    const view = freshView(4, 6);
    expect(view.cycle.phase).toBe("menstrual");
    expect(view.periodAction).toEqual({ kind: "end", periodId: 1 });
    renderCarousel(view);
    expect(screen.getByText("Gentle movement often feels best. Try walking, yoga or light mobility.")).toBeTruthy();
  });
});
