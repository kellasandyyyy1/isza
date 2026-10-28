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

// The grid's rows have a 44px floor, so a grid squeezed below that would spill over the rows under it
// without scrolling the page.
async function expectGridFits(page: Page) {
  const spill = await page
    .getByRole("group", { name: "Days, Monday first" })
    .evaluate((group) => (group.parentElement ? group.parentElement.scrollHeight - group.parentElement.clientHeight : 0));
  expect(spill, "the grid spills out of its box").toBeLessThanOrEqual(0);
}

// Every saved daily log, by date.
async function savedLogs(page: Page) {
  return page.evaluate(
    () =>
      new Promise<Record<string, Record<string, unknown>>>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const all = request.result.transaction("dailyLogs").objectStore("dailyLogs").getAll();
          all.onsuccess = () => {
            request.result.close();
            resolve(Object.fromEntries((all.result as { date: string }[]).map((log) => [log.date, log])));
          };
        };
      }),
  );
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
    // It is a band: rounded on the first and last day, square in between.
    await page.getByRole("button", { name: "Today", exact: true }).click();
    for (const offset of [-1, 0, 5]) await expect(cell(page, day(offset))).toHaveAttribute("data-fertile", "true");
    await expect(cell(page, day(-2))).not.toHaveAttribute("data-fertile");
    await expect(cell(page, day(-2)).locator("[data-fertile-band]")).toHaveCount(0);
    await expect(cell(page, day(-1)).locator("[data-fertile-band]")).toHaveAttribute("data-fertile-band", "start");
    await expect(cell(page, day(2)).locator("[data-fertile-band]")).toHaveAttribute("data-fertile-band", "middle");
    await expect(cell(page, day(5)).locator("[data-fertile-band]")).toHaveAttribute("data-fertile-band", "end");
    await expect(cell(page, day(0))).toHaveAttribute("data-checkin", "true");
    await expect(cell(page, day(1))).not.toHaveAttribute("data-checkin");

    // Today is selected at first, so it shows both the ring and the selected square.
    await expect(cell(page, day(0))).toHaveAttribute("aria-current", "date");
    await expect(cell(page, day(0))).toHaveAttribute("aria-pressed", "true");
    await expect(cell(page, day(0)).locator("[data-selected-mark]")).toHaveCount(1);
    await expect(cell(page, day(1)).locator("[data-selected-mark]")).toHaveCount(0);
  });

  test("the summary strip is about today, in any month", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    const strip = page.getByRole("region", { name: "Today" });
    await expect(strip.getByText("Day 11, Follicular")).toBeVisible();
    await expect(strip.getByText("Period in about 3 weeks")).toBeVisible();
    // The same confidence line as Today, in caption size.
    const confidence = strip.getByText(/^[A-Z][a-z]{2} \d+ to .+ · based on 4 cycles$/);
    await expect(confidence).toBeVisible();
    await expect(confidence).toHaveClass(/\btext-caption\b/);

    await page.getByRole("button", { name: "Next month" }).click();
    await expect(strip.getByText("Day 11, Follicular")).toBeVisible();
    await expectNoVerticalScroll(page);

    await strip.getByRole("button", { name: "Edit period" }).click();
    const sheet = page.getByRole("dialog", { name: format(today, "EEEE, MMMM d") });
    await expect(sheet.getByRole("heading", { name: "Period dates" })).toBeVisible();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await strip.getByRole("button", { name: "Log check-in" }).click();
    await expect(page.getByRole("dialog", { name: "Today's check-in" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
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

  test("under 700px tall the legend row gives its room to the grid, and the header opens the markers sheet", async ({
    page,
  }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await expect(page.locator("[data-legend]")).toBeHidden();
    await expectGridFits(page);
    await page.getByRole("button", { name: "What do these mean?" }).click();
    await expect(page.getByRole("dialog", { name: "Calendar markers" })).toBeVisible();
  });

  test("the fertile band uses its own color, with --fertile-ink dates on it", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    const band = cell(page, day(2)).locator("[data-fertile-band]");
    await expect(band).toHaveClass(/\bbg-fertile-band\b/);
    await expect(band).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(cell(page, day(2)).getByText(String(Number(day(2).slice(8))), { exact: true })).toHaveClass(
      /\btext-fertile-ink\b/,
    );
    // Not on the band: the usual ink.
    await expect(cell(page, day(-3)).getByText(String(Number(day(-3).slice(8))), { exact: true })).toHaveClass(/\btext-ink\b/);
  });

  test("six equal rows, the same gap under the weekdays as between rows, in every month", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    const metrics = () =>
      page.getByRole("group", { name: "Days, Monday first" }).evaluate((group) => {
        const header = group.previousElementSibling?.getBoundingClientRect();
        const cells = [...group.children].map((child) => child.getBoundingClientRect());
        const rows = [0, 7, 14, 21, 28, 35].map((index) => cells[index]);
        return {
          heights: rows.map((row) => Math.round(row.height * 10) / 10),
          headerGap: Math.round((rows[0].top - (header?.bottom ?? 0)) * 10) / 10,
          rowGaps: rows.slice(1).map((row, index) => Math.round((row.top - rows[index].bottom) * 10) / 10),
          gridHeight: Math.round(group.parentElement?.getBoundingClientRect().height ?? 0),
          // The number sits in the middle of its cell.
          offCenter: Math.abs(
            (group.children[0].getBoundingClientRect().top + group.children[0].getBoundingClientRect().bottom) / 2 -
              (() => {
                const number = group.children[0].lastElementChild?.getBoundingClientRect();
                return number ? (number.top + number.bottom) / 2 : 0;
              })(),
          ),
        };
      });
    const first = await metrics();
    expect(new Set(first.heights).size).toBe(1);
    expect(first.heights[0]).toBeGreaterThanOrEqual(44);
    for (const gap of first.rowGaps) expect(gap).toBe(first.headerGap);
    expect(first.offCenter).toBeLessThan(1);
    // The grid keeps its height from month to month.
    for (let month = 0; month < 3; month++) {
      await page.getByRole("button", { name: "Next month" }).click();
      expect((await metrics()).gridHeight).toBe(first.gridHeight);
    }
  });

  test("a past day's check-in opens for that date and saves to it, not today", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await showMonthOf(page, day(-3));
    await cell(page, day(-3)).click();
    await page.getByRole("dialog").getByRole("button", { name: "Edit check-in" }).click();
    const sheet = page.getByRole("dialog", { name: `Check-in for ${format(addDays(today, -3), "EEE, MMM d")}` });
    await expect(sheet).toBeVisible();
    // Prefilled from the demo log for that day.
    const before = await savedLogs(page);
    const savedEnergy = String(before[day(-3)].energy);
    await expect(sheet.getByRole("group", { name: "Energy" }).locator('[aria-pressed="true"]')).toHaveText(savedEnergy);
    const newEnergy = savedEnergy === "2" ? "4" : "2";
    await sheet.getByRole("button", { name: newEnergy, exact: true }).click();
    await sheet.getByRole("button", { name: "Save check-in" }).click();
    // A past day never gets the supportive note, so the sheet closes.
    await expect(sheet).toBeHidden();

    const after = await savedLogs(page);
    expect(after[day(-3)]).toMatchObject({ energy: Number(newEnergy) });
    expect(after[day(0)]).toEqual(before[day(0)]);
    expect(Object.keys(after)).toHaveLength(Object.keys(before).length);
  });

  test("the legend sheet explains every marker", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await page.getByRole("button", { name: "What do these mean?" }).click();
    const sheet = page.getByRole("dialog", { name: "Calendar markers" });
    await expect(sheet.getByText("Soft band behind the days. Estimated only. Not for birth control.")).toBeVisible();
    for (const title of ["Period", "Predicted period", "Fertile window", "Check-in", "Today"]) {
      await expect(sheet.getByText(title, { exact: true })).toBeVisible();
    }
  });
});

test.describe("mobile 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("grid, legend and summary strip fit without scrolling", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    await expect(page.locator("[data-legend]")).toBeVisible();
    await expect(page.getByRole("region", { name: "Today" })).toBeVisible();
    await expectNoVerticalScroll(page);
    await expectGridFits(page);
  });

  test("the legend shows only the markers on the days in the grid, in order", async ({ page }) => {
    await loadDemoData(page);
    await openCalendar(page);
    // This month, the next (the predicted period, 19 days ahead) and two months on (no markers at all).
    for (let month = 0; month < 3; month++) {
      if (month > 0) await page.getByRole("button", { name: "Next month" }).click();
      const grid = page.getByRole("group", { name: "Days, Monday first" });
      const expected = [
        (await grid.locator('[data-period="logged"]').count()) > 0 && "Period",
        (await grid.locator('[data-period="predicted"]').count()) > 0 && "Predicted",
        (await grid.locator("[data-fertile]").count()) > 0 && "Fertile (estimate)",
        (await grid.locator("[data-checkin]").count()) > 0 && "Check-in",
      ].filter(Boolean);
      await expect(page.locator("[data-legend] li")).toHaveText(expected as string[]);
      // The header's info button is only for short screens.
      await expect(page.getByRole("button", { name: "What do these mean?" })).toHaveCount(1);
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
