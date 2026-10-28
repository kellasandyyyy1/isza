import { expect, test } from "@playwright/test";
import { addDays, format } from "date-fns";
import { completeOnboarding, putRecords } from "./helpers";

// Screenshots of the early Insights state for review: every tab, light and dark, at 0, 4 and 20 check-ins.
test.use({ viewport: { width: 390, height: 844 } });

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");
const MOODS = ["okay", "good", "okay", "low", "great"] as const;
const SYMPTOMS = ["cramps", "fatigue", "headache", "bloating", "cravings"] as const;

// One check-in a day ending today, inside a cycle that started 21 days ago.
function checkIns(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const offset = -(count - 1 - index);
    return {
      date: day(offset),
      bleeding: offset <= -17 ? "medium" : "none",
      energy: 2 + (index % 3),
      mood: MOODS[index % MOODS.length],
      symptoms: index % 2 === 0 ? [{ key: SYMPTOMS[index % SYMPTOMS.length], severity: 1 + (index % 3) }] : [],
      sleepHours: null,
      bbt: null,
      lhTest: null,
      note: null,
      updatedAt: `${day(offset)}T20:00:00.000Z`,
    };
  });
}

for (const count of [0, 4, 20]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`insights with ${count} check-ins, ${colorScheme}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme });
      await completeOnboarding(page);
      await putRecords(page, "periods", [{ id: 1, startDate: day(-21), endDate: day(-17) }]);
      if (count > 0) await putRecords(page, "dailyLogs", checkIns(count));
      await page.goto("/insights");

      const summary = page.getByRole("region", { name: "This cycle so far" });
      await expect(summary).toBeVisible();
      if (count > 0) {
        await expect(summary.locator("dt", { hasText: "Check-ins" }).locator("xpath=following-sibling::dd")).toHaveText(
          String(count),
        );
      }
      // The mascot fills the tab only while there is nothing logged yet.
      await expect(page.locator('img[src*="mascot-insights"]:visible')).toHaveCount(count === 0 ? 1 : 0);
      await page.screenshot({ path: testInfo.outputPath(`patterns-${count}-${colorScheme}.png`) });

      await page.getByRole("tab", { name: "Cycles" }).click();
      await expect(page.getByText("Your cycle history appears after your second period.")).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`cycles-${count}-${colorScheme}.png`) });

      await page.getByRole("tab", { name: "Report" }).click();
      await expect(page.getByRole("button", { name: "Create PDF" })).toBeDisabled();
      await page.screenshot({ path: testInfo.outputPath(`report-${count}-${colorScheme}.png`) });
    });
  }
}
