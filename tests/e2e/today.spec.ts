import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { completeOnboarding, expectNoVerticalScroll, loadDemoData, putRecords } from "./helpers";

const iso = (date: Date) => format(date, "yyyy-MM-dd");
const daysAgo = (days: number) => iso(subDays(new Date(), days));

function log(date: string, bleeding: string) {
  return {
    date,
    bleeding,
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

async function openToday(page: Page) {
  await page.goto("/today");
  await expect(page.getByText(/^Good (morning|afternoon|evening)/)).toBeVisible();
}

for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
]) {
  test.describe(`mobile ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("empty database: shows the no-data state and logs a period", async ({ page }) => {
      await openToday(page);
      await expect(page.getByRole("heading", { name: "Let's find your rhythm" })).toBeVisible();
      await expect(page.getByText("Log your last period to start.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Log today's check-in" })).toBeVisible();
      await expectNoVerticalScroll(page);

      await page.getByRole("button", { name: "Log period" }).click();
      const save = page.getByRole("button", { name: "Save period" });
      await expect(save).toBeDisabled();
      await page.locator('button[aria-current="date"]').click();
      await save.click();

      await expect(page.getByRole("progressbar", { name: /^Cycle day 1/ })).toBeVisible();
      await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
      await expectNoVerticalScroll(page);
    });

    test("demo data: hero, readiness sheet, plan sheet and check-in", async ({ page }) => {
      await loadDemoData(page);
      await openToday(page);

      // The demo's current cycle started 10 days ago.
      await expect(page.getByText("Day 11", { exact: true })).toBeVisible();
      await expect(page.getByText("Follicular", { exact: true })).toBeVisible();
      await expect(page.getByText(/^Period in about \d+ (days|weeks)$/)).toBeVisible();
      await expect(page.getByText(/^[A-Z][a-z]{2} \d+ to/)).toBeVisible();
      await expectNoVerticalScroll(page);

      // Today is logged in the demo data, so the score comes from the check-in.
      await page.getByRole("button", { name: /^Readiness \d+, (Go|Steady|Rest), from your check-in\. Show details$/ }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet.getByText("Cycle phase and your history")).toBeVisible();
      await sheet.getByRole("button", { name: "Close" }).click();
      await expect(sheet).toBeHidden();

      // Today is already logged in the demo data.
      await page.getByRole("button", { name: "Edit check-in" }).click();
      await expect(page.getByRole("dialog", { name: "Today's check-in" })).toBeVisible();
      await page.getByRole("button", { name: "Close" }).click();

      await page.getByRole("button", { name: "Train", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Train" })).toContainText("Energy is often rising.");
      await page.getByRole("button", { name: "Log workout" }).click();
      await expect(page).toHaveURL(/\/train$/);
    });

    test("health flags: chip, sheet and dismiss for 30 days", async ({ page }) => {
      await loadDemoData(page);
      await openToday(page);
      // Very heavy flow on two days of the current period raises the heavy-flow flag.
      await putRecords(page, "dailyLogs", [log(daysAgo(10), "very-heavy"), log(daysAgo(9), "very-heavy")]);
      await openToday(page);

      const chip = page.getByRole("button", { name: /Very heavy flow on several days/ });
      await expect(chip).toBeVisible();
      await expectNoVerticalScroll(page);

      await chip.click();
      const sheet = page.getByRole("dialog", { name: "Health notes" });
      await expect(sheet).toContainText("Consider talking to a doctor.");
      await sheet.getByRole("button", { name: "Dismiss for 30 days" }).click();
      await expect(chip).toBeHidden();
    });

    test("hormonal contraception: cycle day without a phase, with an explanation", async ({ page }) => {
      await completeOnboarding(page, { contraception: "Hormonal IUD", periodStartsToday: true });
      await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
      await expect(page.getByText("Menstrual", { exact: true })).toHaveCount(0);
      await expectNoVerticalScroll(page);

      await page.getByRole("button", { name: "Why phases are hidden" }).click();
      await expect(page.getByRole("dialog", { name: "Why phases are hidden" })).toContainText(
        "Hormonal contraception changes your natural cycle",
      );
    });

    test("worst case: period pill and a health flag chip both fit without scrolling", async ({ page }) => {
      await loadDemoData(page);
      // An open period that started 4 days ago, with very heavy flow on two days: the "ended" pill and a flag.
      await putRecords(page, "periods", [{ id: 99, startDate: daysAgo(4), endDate: null }]);
      await putRecords(page, "dailyLogs", [log(daysAgo(4), "very-heavy"), log(daysAgo(3), "very-heavy")]);
      await openToday(page);

      await expect(page.getByRole("button", { name: "Period ended today?" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Very heavy flow on several days/ })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Readiness \d+, (Go|Steady|Rest), (estimated|from your check-in)\. Show details$/ }),
      ).toBeVisible();
      await expectNoVerticalScroll(page);
    });

    test("period pill: one tap starts a late period, Undo removes it", async ({ page }) => {
      await completeOnboarding(page);
      // The last period started 35 days ago, so the next one is late.
      await putRecords(page, "periods", [{ id: 1, startDate: daysAgo(35), endDate: daysAgo(31) }]);
      await openToday(page);

      const pill = page.getByRole("button", { name: "Period started today?" });
      await pill.click();
      await expect(page.getByRole("status").filter({ hasText: "Period logged" })).toBeVisible();
      await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
      await expect(pill).toBeHidden();

      await page.getByRole("button", { name: "Undo" }).click();
      await expect(pill).toBeVisible();
      await expect(page.getByText("Day 36", { exact: true })).toBeVisible();
    });

    test("period pill: one tap ends an open period, Undo reopens it", async ({ page }) => {
      await loadDemoData(page);
      await putRecords(page, "periods", [{ id: 99, startDate: daysAgo(4), endDate: null }]);
      await openToday(page);

      const pill = page.getByRole("button", { name: "Period ended today?" });
      await pill.click();
      await expect(page.getByRole("status").filter({ hasText: "Period logged" })).toBeVisible();
      await expect(pill).toBeHidden();

      await page.getByRole("button", { name: "Undo" }).click();
      await expect(pill).toBeVisible();
    });

    test("irregular cycles: cycle day without a phase, with an explanation", async ({ page }) => {
      await completeOnboarding(page);
      // Lengths 22, 40 and 26 days, with the latest start 5 days ago.
      const starts = [93, 71, 31, 5].map(daysAgo);
      await putRecords(
        page,
        "periods",
        starts.map((startDate, index) => ({ id: index + 1, startDate, endDate: null })),
      );
      await openToday(page);

      await expect(page.getByText("Day 6", { exact: true })).toBeVisible();
      await expectNoVerticalScroll(page);
      await page.getByRole("button", { name: "Why phases are hidden" }).click();
      await expect(page.getByRole("dialog", { name: "Why phases are hidden" })).toContainText(
        "Your cycle lengths vary a lot",
      );
    });
  });
}

test.describe("desktop 1440x900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("two columns with the readiness breakdown inline", async ({ page }) => {
    await loadDemoData(page);
    await openToday(page);

    await expect(page.getByRole("heading", { name: "Readiness" })).toBeVisible();
    await expect(page.getByText("Cycle phase and your history")).toBeVisible();
    await expect(page.getByRole("button", { name: /Show details$/ })).toBeHidden();
    await expect(page.getByRole("region", { name: "Today's plan" })).toHaveCount(1);
    for (const topic of ["Train", "Food", "Energy", "Sleep", "Social"]) {
      await expect(page.getByRole("button", { name: topic, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Daily check-in" })).toBeVisible();
  });
});
