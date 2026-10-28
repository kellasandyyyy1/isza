import { expect, test, type Page } from "@playwright/test";
import { DAILY_NOTES } from "../../src/content/daily-notes";
import { expectNoVerticalScroll, loadDemoData } from "./helpers";

const ALL_TEXTS = new Set(Object.values(DAILY_NOTES).flatMap((notes) => notes.map((note) => note.text)));

const carouselRow = (page: Page) => page.locator("section[aria-label=\"Today's plan\"]:visible > div").first();

async function withWaterTracking(page: Page) {
  await loadDemoData(page);
  await page.goto("/today");
  await expect(carouselRow(page).locator(":scope > *")).toHaveCount(6);
}

// Each card's height, and each daily line's height in lines.
async function measure(page: Page) {
  return carouselRow(page)
    .locator(":scope > *")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const note = card.querySelector<HTMLElement>("[data-daily-note]");
        const lineHeight = note ? parseFloat(getComputedStyle(note).lineHeight) : 0;
        return {
          height: Math.round(card.getBoundingClientRect().height),
          note: note?.textContent ?? null,
          lines: note ? Math.round(note.getBoundingClientRect().height / lineHeight) : 0,
        };
      }),
    );
}

test.describe("360px wide", () => {
  // Tall enough that the cards show their text; under 700px tall they are title rows.
  test.use({ viewport: { width: 360, height: 800 } });

  test("all six cards show a daily line under their phase line, at one equal height", async ({ page }) => {
    await withWaterTracking(page);
    const cards = await measure(page);
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.note && ALL_TEXTS.has(card.note), card.note ?? "no note").toBe(true);
      expect(card.lines).toBeGreaterThanOrEqual(1);
      expect(card.lines).toBeLessThanOrEqual(2);
    }
    // Different cards, different lines.
    expect(new Set(cards.map((card) => card.note)).size).toBe(6);
    expect(new Set(cards.map((card) => card.height)).size).toBe(1);
  });

  test("cards stay one height when every daily line runs to two lines", async ({ page }) => {
    await withWaterTracking(page);
    // The longest notes, put on every card at once.
    await carouselRow(page).evaluate((row) => {
      for (const note of row.querySelectorAll<HTMLElement>("[data-daily-note]")) {
        note.textContent = "A favorite cup can make water feel like a small treat today.";
      }
    });
    const cards = await measure(page);
    for (const card of cards) expect(card.lines, card.note ?? "").toBe(2);
    expect(new Set(cards.map((card) => card.height)).size).toBe(1);
  });
});

test.describe("phones", () => {
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
  ]) {
    test(`Today fits at ${viewport.width}x${viewport.height} with the daily lines`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await withWaterTracking(page);
      await expectNoVerticalScroll(page);
    });
  }
});

test("the same lines show after a reload, and in each card's sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await withWaterTracking(page);
  const before = (await measure(page)).map((card) => card.note);
  await page.reload();
  await expect(carouselRow(page).locator(":scope > *")).toHaveCount(6);
  expect((await measure(page)).map((card) => card.note)).toEqual(before);

  // Train's sheet: the phase line, then today's line.
  await page.getByRole("button", { name: "Train", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Train" })).toContainText(before[0] ?? "");
  await page.getByRole("dialog", { name: "Train" }).getByRole("button", { name: "Close" }).click();

  // Water's sheet: today's line, with the phase water line under it and never on the card.
  await carouselRow(page).getByRole("button", { name: "Drink water", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Water" });
  await expect(sheet).toContainText(before[2] ?? "");
});
