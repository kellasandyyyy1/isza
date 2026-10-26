import { expect, test, type Page } from "@playwright/test";
import { addDays, format, parseISO } from "date-fns";
import { completeOnboarding, expectNoVerticalScroll, loadDemoData } from "./helpers";

const today = new Date();
const iso = (date: Date) => format(date, "yyyy-MM-dd");
const day = (offset: number) => iso(addDays(today, offset));
const cell = (page: Page, date: string) => page.locator(`[data-date="${date}"]`);

// The demo data's period starts: the current cycle began 10 days ago, after cycles of 27, 29, 28 and 30 days.
const DEMO_STARTS = [-124, -97, -68, -40, -10];
// Average 28.5 rounds to 29: the next period is predicted 19 days from today, for 5 days.
const PREDICTED_START = 19;

async function openCalendar(page: Page) {
  await page.goto("/calendar");
  await expect(page.locator("[aria-current='date']")).toBeVisible();
}

// Moves the calendar to the month that contains the date.
async function showMonthOf(page: Page, date: string) {
  const target = format(parseISO(date), "MMMM yyyy");
  const heading = page.getByRole("heading", { level: 2 }).first();
  for (let step = 0; step < 12; step++) {
    const current = (await heading.textContent()) ?? "";
    if (current === target) return;
    const shown = parseISO(`${format(new Date(`1 ${current}`), "yyyy-MM")}-01`);
    const forward = parseISO(`${date.slice(0, 7)}-01`) > shown;
    await page.getByRole("button", { name: forward ? "Next month" : "Previous month" }).click();
  }
  await expect(heading).toHaveText(target);
}

test.describe("mobile 360x640", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("demo data shows 4 past cycles and the next prediction, without scrolling", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await expectNoVerticalScroll(page);
    const legend = page.locator("[data-legend]");
    expect(await legend.evaluate((list) => list.scrollWidth - list.clientWidth)).toBeLessThanOrEqual(0);

    for (const start of DEMO_STARTS) {
      await showMonthOf(page, day(start));
      for (let offset = 0; offset < 5; offset++) {
        await expect(cell(page, day(start + offset))).toHaveAttribute("data-period", "logged");
      }
      await expect(cell(page, day(start + 5))).not.toHaveAttribute("data-period", "logged");
    }

    await showMonthOf(page, day(PREDICTED_START));
    for (let offset = 0; offset < 5; offset++) {
      await expect(cell(page, day(PREDICTED_START + offset))).toHaveAttribute("data-period", "predicted");
    }
    await expect(cell(page, day(PREDICTED_START + 5))).not.toHaveAttribute("data-period");

    // Current fertile window: ovulation predicted on cycle day 15, so days 10 to 16 (yesterday to 5 days ahead).
    await page.getByRole("button", { name: "Today", exact: true }).click();
    for (const offset of [-1, 0, 5]) await expect(cell(page, day(offset))).toHaveAttribute("data-fertile", "true");
    await expect(cell(page, day(-2))).not.toHaveAttribute("data-fertile");
    await expect(cell(page, day(0))).toHaveAttribute("data-checkin", "true");
    await expect(cell(page, day(1))).not.toHaveAttribute("data-checkin");
  });

  test("tapping a day opens its sheet, and Edit check-in replaces it", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await cell(page, day(0)).click();
    const sheet = page.getByRole("dialog", { name: format(today, "EEEE, MMMM d") });
    await expect(sheet.getByText("Cycle day 11, follicular phase")).toBeVisible();
    await expect(sheet.getByText("Energy")).toBeVisible();

    await sheet.getByRole("button", { name: "Edit check-in" }).click();
    await expect(page.getByRole("dialog", { name: "Today's check-in" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });

  test("a future day only shows the prediction", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await showMonthOf(page, day(5));
    await cell(page, day(5)).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Predicted: cycle day 16, ovulatory phase")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Edit check-in" })).toHaveCount(0);
    await expect(sheet.getByRole("button", { name: "Edit period dates" })).toHaveCount(0);
  });

  test("edits and removes a period from the day sheet", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await showMonthOf(page, day(-8));
    await cell(page, day(-8)).click();
    let sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Edit period dates" }).click();
    await expect(sheet.getByRole("heading", { name: "Period dates" })).toBeFocused();

    const end = sheet.getByLabel(/^End date/);
    await expect(end).toHaveValue(day(-6));
    await end.fill(day(-12));
    await expect(sheet.getByText("The end date can't be before the start date.")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Save dates" })).toBeDisabled();
    await end.fill(day(-7));
    await sheet.getByRole("button", { name: "Save dates" }).click();
    await expect(sheet.getByRole("button", { name: "Edit period dates" })).toBeVisible();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(cell(page, day(-7))).toHaveAttribute("data-period", "logged");
    await expect(cell(page, day(-6))).not.toHaveAttribute("data-period", "logged");

    await cell(page, day(-8)).click();
    sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Edit period dates" }).click();
    await sheet.getByRole("button", { name: "Remove period" }).click();
    const from = format(addDays(today, -10), "MMM d");
    const to = format(addDays(today, -7), "MMM d");
    await expect(sheet.getByText(`This deletes the period from ${from} to ${to}.`)).toBeVisible();
    await sheet.getByRole("button", { name: "Remove period" }).click();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(cell(page, day(-10))).not.toHaveAttribute("data-period", "logged");
  });

  test("marks a past day as a period start", async ({ page }) => {
    await completeOnboarding(page);
    await openCalendar(page);
    await showMonthOf(page, day(-3));
    await cell(page, day(-3)).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("No cycle prediction for this day yet.")).toBeVisible();
    await sheet.getByRole("button", { name: "Edit period dates" }).click();
    await sheet.getByRole("button", { name: "Mark as period start" }).click();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(cell(page, day(-3))).toHaveAttribute("data-period", "logged");
  });

  test("swipes and buttons change the month, Today returns", async ({ page }) => {
    await completeOnboarding(page);
    await openCalendar(page);
    const heading = page.getByRole("heading", { level: 2 }).first();
    const thisMonth = format(today, "MMMM yyyy");
    await expect(heading).toHaveText(thisMonth);

    const grid = page.getByRole("group", { name: "Days, Monday first" });
    await grid.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 300, clientY: 300 });
    await grid.dispatchEvent("pointerup", { pointerType: "touch", clientX: 100, clientY: 310 });
    await expect(heading).toHaveText(format(addDays(new Date(today.getFullYear(), today.getMonth(), 1), 40), "MMMM yyyy"));

    await page.getByRole("button", { name: "Previous month" }).click();
    await page.getByRole("button", { name: "Previous month" }).click();
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await expect(heading).toHaveText(thisMonth);
  });

  test("the legend sheet explains every marker", async ({ page }) => {
    await completeOnboarding(page);
    await openCalendar(page);
    await page.getByRole("button", { name: "What the markers mean" }).click();
    const sheet = page.getByRole("dialog", { name: "Calendar markers" });
    await expect(sheet.getByText("Estimated only. Not for birth control.")).toBeVisible();
    for (const title of ["Period", "Predicted period", "Fertile window", "Check-in", "Today"]) {
      await expect(sheet.getByText(title, { exact: true })).toBeVisible();
    }
  });
});

test.describe("desktop 1440x900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the selected day panel is always visible", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    const panel = page.getByRole("region", { name: "Selected day" });
    await expect(panel.getByRole("heading", { name: format(today, "EEEE, MMMM d") })).toBeVisible();

    await cell(page, day(-1)).click();
    await expect(panel.getByRole("heading", { name: format(addDays(today, -1), "EEEE, MMMM d") })).toBeVisible();
    await expect(cell(page, day(-1))).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
