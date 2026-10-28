import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { completeOnboarding, expectNoVerticalScroll, putRecords } from "./helpers";

const daysAgo = (days: number) => format(subDays(new Date(), days), "yyyy-MM-dd");
const carousel = (page: Page) => page.locator("section[aria-label=\"Today's plan\"]:visible");
const cards = (page: Page) => carousel(page).locator(":scope > div").first().locator(":scope > *");

// A new user on day 5 of a period that is still open (a 6 day usual period), with the Water card: the
// "Period ended today?" pill shows above the cards, which used to strip every card down to its title.
async function newUserOnDay5(page: Page) {
  await completeOnboarding(page);
  await putRecords(page, "periods", [{ id: 1, startDate: daysAgo(4), endDate: null }]);
  await page.goto("/today");
  await expect(page.getByText("Day 5", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Period ended today?" })).toBeVisible();
  await expect(cards(page)).toHaveCount(6);
}

// The hero card shrinks to the space left: if the cards took too much, rows inside it would overflow instead of
// the page scrolling.
async function expectHeroFits(page: Page) {
  const overflow = await page
    .getByRole("img", { name: /^Cycle ring./ })
    .evaluate((ring) => {
      const card = ring.closest(".rounded-card");
      return card ? card.scrollHeight - card.clientHeight : 0;
    });
  expect(overflow, "hero rows overflow the card").toBeLessThanOrEqual(0);
}

// The visible text lines under each card's title.
async function visibleBodies(page: Page) {
  return cards(page).evaluateAll((items) =>
    items.map((item) => ({
      title: item.querySelector("h2")?.textContent?.trim() ?? "",
      lines: [...item.querySelectorAll("p")]
        .filter((line) => line.getBoundingClientRect().height > 0)
        .map((line) => line.textContent?.trim() ?? ""),
    })),
  );
}

test.describe("390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a new user on day 5 sees all six cards with full bodies, and Today does not scroll", async ({ page }, testInfo) => {
    await newUserOnDay5(page);
    const bodies = await visibleBodies(page);
    expect(bodies.map(({ title }) => title)).toEqual(["Train", "Food", "Drink water", "Energy", "Sleep", "Social"]);
    for (const { title, lines } of bodies) {
      expect(lines.length, title).toBeGreaterThanOrEqual(2);
      for (const line of lines) expect(line, title).not.toBe("");
    }
    await expect(carousel(page).getByText("Gentle movement often feels best. Try walking, yoga or light mobility.")).toBeVisible();
    await expectNoVerticalScroll(page);
    await expectHeroFits(page);

    // Scroll through every card for review.
    const row = carousel(page).locator(":scope > div").first();
    for (let index = 0; index < 6; index++) {
      await row.evaluate((element, at) => {
        element.scrollLeft = (element.children[at] as HTMLElement).offsetLeft - 16;
      }, index);
      await page.waitForTimeout(300);
      await page.screenshot({ path: testInfo.outputPath(`day5-card-${index}.png`) });
    }
  });
});

// Full cards wherever they fit beside the pill: measured from 720px tall under 380px wide, 820px tall from 380px.
for (const viewport of [
  { width: 360, height: 720 },
  { width: 360, height: 740 },
  { width: 375, height: 740 },
  { width: 412, height: 915 },
]) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("full bodies on every card, and Today does not scroll", async ({ page }) => {
      await newUserOnDay5(page);
      for (const { title, lines } of await visibleBodies(page)) {
        expect(lines.length, title).toBeGreaterThanOrEqual(2);
        for (const line of lines) expect(line, title).not.toBe("");
      }
      await expectNoVerticalScroll(page);
      await expectHeroFits(page);
    });
  });
}

// A wide phone that is not tall enough for full cards beside the pill: title rows, so Today still never scrolls.
test.describe("412x780", () => {
  test.use({ viewport: { width: 412, height: 780 } });

  test("title rows, and Today does not scroll", async ({ page }) => {
    await newUserOnDay5(page);
    const train = (await visibleBodies(page))[0];
    expect(train).toEqual({ title: "Train", lines: [] });
    await expectNoVerticalScroll(page);
    await expectHeroFits(page);
  });
});
