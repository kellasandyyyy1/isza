import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { completeOnboarding, expectNoVerticalScroll, putRecords } from "./helpers";

const daysAgo = (days: number) => format(subDays(new Date(), days), "yyyy-MM-dd");

function heavyLog(date: string) {
  return {
    date,
    bleeding: "very-heavy",
    energy: 3,
    mood: null,
    symptoms: [],
    sleepHours: null,
    bbt: null,
    lhTest: null,
    note: null,
    updatedAt: `${date}T20:00:00.000Z`,
  };
}

// Worst case: 50 days late (two caption lines), the period pill, and a flag chip from very heavy flow.
async function openWorstCase(page: Page) {
  await completeOnboarding(page);
  await putRecords(page, "periods", [{ id: 1, startDate: daysAgo(81), endDate: daysAgo(77) }]);
  await putRecords(page, "dailyLogs", [heavyLog(daysAgo(81)), heavyLog(daysAgo(80))]);
  await page.goto("/today");
  await expect(page.getByText("Period is 50 days late", { exact: true })).toBeVisible();
  await expect(page.getByText(/consider talking to a doctor/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Period started today?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Very heavy flow on several days/ })).toBeVisible();
}

// The hero's visible blocks, top to bottom, and the empty space between them. The ring block is measured by the
// ring itself, so a ring smaller than its row would show up as a larger gap.
async function heroGaps(page: Page) {
  return page.getByRole("img", { name: /^Cycle ring\./ }).evaluate((ring) => {
    const card = ring.closest(".rounded-card");
    const blocks = [...(card?.firstElementChild?.children ?? [])].filter((block) => block.getClientRects().length > 0);
    const rects = blocks.map((block, index) => (index === 0 ? ring : block).getBoundingClientRect());
    return {
      cardHeight: card?.getBoundingClientRect().height ?? 0,
      ring: ring.getBoundingClientRect().height,
      gaps: rects.slice(1).map((rect, index) => Math.round(rect.top - rects[index].bottom)),
    };
  });
}

const VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

for (const viewport of VIEWPORTS) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`worst case at ${viewport.width}x${viewport.height}, ${colorScheme}: even gaps, no scroll`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      await openWorstCase(page);
      await expectNoVerticalScroll(page);

      const { gaps, ring, cardHeight } = await heroGaps(page);
      // Ring, period, readiness; under 380px wide readiness sits beside the ring.
      expect(gaps).toHaveLength(viewport.width < 380 ? 1 : 2);
      for (const gap of gaps) expect(gap, `gaps ${gaps.join(", ")}`).toBe(20);
      expect(ring).toBeGreaterThanOrEqual(150);
      console.log(`${viewport.width}x${viewport.height} ${colorScheme}: gaps ${gaps.join(", ")}px, ring ${ring}px, card ${cardHeight}px`);

      await expect(page.getByRole("img", { name: /^Cycle ring\./ })).toHaveCSS("opacity", "1");
      await page.screenshot({ path: testInfo.outputPath(`today-${viewport.width}-${colorScheme}.png`) });
    });
  }
}

test("the hero is shorter on a 360x640 screen than on a 430x932 one, and the ring grows instead", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await openWorstCase(page);
  const tall = await heroGaps(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await expect.poll(async () => (await heroGaps(page)).cardHeight).toBeLessThan(tall.cardHeight);
  const short = await heroGaps(page);
  expect(short.ring).toBeLessThan(tall.ring);
});

test("the readiness advice wraps instead of clipping", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorstCase(page);
  const advice = page.getByRole("button", { name: /^Readiness \d+/ }).locator("span.text-small").last();
  const fits = await advice.evaluate((element) => ({
    clipped: element.scrollWidth > element.clientWidth,
    ellipsis: getComputedStyle(element).textOverflow,
    lines: Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)),
  }));
  expect(fits.clipped).toBe(false);
  expect(fits.ellipsis).not.toBe("ellipsis");
  expect(fits.lines).toBeLessThanOrEqual(2);
});
