import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding, expectNoVerticalScroll, loadDemoData, putRecords } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

const waterGroup = (page: Page) => page.getByRole("region", { name: "Water" });

async function openDetails(page: Page) {
  await page.goto("/today");
  await page.getByRole("button", { name: /^(Log today's|Edit) check-in$/ }).first().click();
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await sheet.getByRole("button", { name: "More details" }).click();
  return sheet;
}

test("the tally is on from the start: in the check-in, with only the reminders switch in Me, off", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/me");
  await expect(waterGroup(page).getByRole("switch")).toHaveCount(1);
  await expect(waterGroup(page).getByRole("switch", { name: "Water reminders" })).not.toBeChecked();
  await expect(waterGroup(page).getByRole("switch", { name: "Water reminders" })).toBeEnabled();
  await expect(waterGroup(page).getByText("Reminders only. Iszacycle does not set a daily target.")).toBeVisible();

  const sheet = await openDetails(page);
  await expect(sheet.getByText("Water", { exact: true })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Add a glass" })).toBeVisible();
});

test("the tally counts up and down from the check-in details, above sleep, with no goal anywhere", async ({ page }) => {
  await completeOnboarding(page, { periodStartsToday: true });

  const sheet = await openDetails(page);
  const count = sheet.getByText(/^(No glasses logged yet|\d+ glass(es)? today)$/);
  await expect(count).toHaveText("No glasses logged yet");
  const mutedColor = await count.evaluate((element) => getComputedStyle(element).color);
  await expect(sheet.getByRole("button", { name: "Remove a glass" })).toBeDisabled();

  await sheet.getByRole("button", { name: "Add a glass" }).click();
  await expect(count).toHaveText("1 glass today");
  for (let glass = 0; glass < 3; glass++) await sheet.getByRole("button", { name: "Add a glass" }).click();
  await expect(count).toHaveText("4 glasses today");
  await sheet.getByRole("button", { name: "Remove a glass" }).click();
  await expect(count).toHaveText("3 glasses today");
  // The same muted color at any count: nothing changes color.
  expect(await count.evaluate((element) => getComputedStyle(element).color)).toBe(mutedColor);

  // Day 1 of a period: the menstrual note sits with the tally.
  await expect(sheet.getByText("Warm drinks and water are often welcome on these days.")).toBeVisible();
  // Above sleep hours.
  const [water, sleep] = await Promise.all([
    sheet.getByText("Water", { exact: true }).boundingBox(),
    sheet.getByRole("button", { name: "Half an hour more" }).boundingBox(),
  ]);
  expect(water?.y ?? 0).toBeLessThan(sleep?.y ?? 0);
  // No goal, ring, bar or streak.
  await expect(sheet.getByRole("progressbar")).toHaveCount(0);
  await expect(sheet.getByText(/goal|target|streak|of 8/i)).toHaveCount(0);

  // It saved at once, without saving the check-in.
  await sheet.getByRole("button", { name: "Close" }).click();
  const saved = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const all = request.result.transaction("waterLogs").objectStore("waterLogs").getAll();
          all.onsuccess = () => resolve((all.result as { count: number }[])[0]?.count ?? -1);
        };
      }),
  );
  expect(saved).toBe(3);
});

test("water reminders: a window, an interval and the times they give", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/me");
  const group = waterGroup(page);
  const reminders = group.getByRole("switch", { name: "Water reminders" });
  await expect(reminders).toBeEnabled();
  await reminders.click();
  await expect(reminders).toBeChecked();
  // Notifications are not on in this browser: still works in the app, and says how to get it when closed.
  await expect(group.getByText("Turn on notifications to get these when the app is closed.")).toBeVisible();

  await expect(group.getByLabel("From")).toHaveValue("08:00");
  await expect(group.getByLabel("To")).toHaveValue("20:00");
  await expect(group.getByText("At 08:00, 11:00, 14:00, 17:00, 20:00.")).toBeVisible();
  await group.getByRole("tab", { name: "2 hours" }).click();
  await expect(group.getByText("At 08:00, 10:00, 12:00, 14:00, 16:00.")).toBeVisible();
  await group.getByLabel("From").fill("09:00");
  await expect(group.getByText("At 09:00, 11:00, 13:00, 15:00, 17:00.")).toBeVisible();

  // Reminders off hides the window.
  await reminders.click();
  await expect(reminders).not.toBeChecked();
  await expect(group.getByLabel("From")).toHaveCount(0);
});

// The cards in the mobile carousel, by their titles.
async function carouselTitles(page: Page) {
  const row = page.locator("section[aria-label=\"Today's plan\"]:visible > div").first();
  return row.locator(":scope > * h2").allTextContents();
}

// The carousel dots, one per card.
const dots = (page: Page) => page.locator("section[aria-label=\"Today's plan\"]:visible > div[aria-hidden] > span");

test("no mascot renders anywhere on the Me page", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/me");
  await waterGroup(page).getByRole("switch", { name: "Water reminders" }).click();
  await expect(page.locator('img[src*="/mascot/"]')).toHaveCount(0);
});

test("the carousel has Water third from the start", async ({ page }) => {
  await loadDemoData(page);
  await page.goto("/today");
  await expect.poll(() => carouselTitles(page)).toEqual(["Train", "Food", "Drink water", "Energy", "Sleep", "Social"]);
  await expect(dots(page)).toHaveCount(6);
  // The water mascot, on the Water card only.
  await expect(page.locator('img[src*="mascot-water"]:visible')).toHaveCount(1);
  await expectNoVerticalScroll(page);
});

test("plus on the Today card and plus in the check-in update the same day, live", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/today");
  const card = page.locator("section[aria-label=\"Today's plan\"]:visible").getByRole("button", { name: "Add a glass" });
  // One tap counts at once, with no sheet.
  await card.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("1 glass today").first()).toBeVisible();

  // The check-in details show the same count, and their plus moves the card behind the sheet.
  const sheet = await openDetails(page);
  await expect(sheet.getByText("1 glass today")).toBeVisible();
  await sheet.getByRole("button", { name: "Add a glass" }).click();
  await expect(sheet.getByText("2 glasses today")).toBeVisible();
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("section[aria-label=\"Today's plan\"]:visible").getByText("2 glasses today")).toBeVisible();

  // The card body opens the water sheet with plus and minus, from the same record.
  await page.locator("section[aria-label=\"Today's plan\"]:visible").getByRole("button", { name: "Drink water", exact: true }).click();
  const water = page.getByRole("dialog", { name: "Water" });
  await expect(water.getByText("2 glasses today")).toBeVisible();
  await water.getByRole("button", { name: "Remove a glass" }).click();
  await expect(water.getByText("1 glass today")).toBeVisible();
  await water.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("section[aria-label=\"Today's plan\"]:visible").getByText("1 glass today")).toBeVisible();

  const rows = await page.evaluate(
    () =>
      new Promise<{ date: string; count: number }[]>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const all = request.result.transaction("waterLogs").objectStore("waterLogs").getAll();
          all.onsuccess = () => resolve(all.result);
        };
      }),
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].count).toBe(1);
});

test("the water sheet shows the phase note when there is one", async ({ page }) => {
  await completeOnboarding(page, { periodStartsToday: true });
  await page.goto("/today");
  await page.locator("section[aria-label=\"Today's plan\"]:visible").getByRole("button", { name: "Drink water", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Water" })).toContainText(
    "Warm drinks and water are often welcome on these days.",
  );
});

test.describe("short screens", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("hide the mascot under 700px tall, keeping the count and plus, without scrolling", async ({ page }) => {
    await loadDemoData(page);
    await page.goto("/today");
    const carousel = page.locator("section[aria-label=\"Today's plan\"]:visible");
    await expect(carousel.getByRole("button", { name: "Add a glass" })).toBeAttached();
    await expect(carousel.getByText("No glasses logged yet")).toBeAttached();
    await expect(page.locator('img[src*="mascot-water"]:visible')).toHaveCount(0);
    await expectNoVerticalScroll(page);
  });
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
]) {
  test.describe(`worst case ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("Today still fits with the Water card, a late period, the pill and a flag", async ({ page }) => {
      await completeOnboarding(page);
      const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const heavy = (date: string) => ({
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
      });
      await putRecords(page, "periods", [{ id: 1, startDate: daysAgo(81), endDate: daysAgo(77) }]);
      await putRecords(page, "dailyLogs", [heavy(daysAgo(81)), heavy(daysAgo(80))]);
      await page.goto("/today");
      await expect(page.getByText(/^Period is \d+ days late$/)).toBeVisible();
      await expectNoVerticalScroll(page);
    });
  });
}
