import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { completeOnboarding, putRecords } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

const daysAgo = (days: number) => format(subDays(new Date(), days), "yyyy-MM-dd");

// Three cycles of the same length, the latest started 9 days ago: day 10, with "of N" shown.
for (const dayCount of [24, 28, 34]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`ring at ${dayCount} days, ${colorScheme}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme });
      await completeOnboarding(page);
      const starts = [9 + 2 * dayCount, 9 + dayCount, 9];
      await putRecords(
        page,
        "periods",
        starts.map((start, index) => ({ id: index + 1, startDate: daysAgo(start), endDate: daysAgo(start - 4) })),
      );
      await page.goto("/today");

      const ring = page.getByRole("img", { name: new RegExp(`^Cycle ring\\. Day 10 of about ${dayCount}, \\w+ phase\\.$`) });
      await expect(ring).toBeVisible();
      await expect(ring.locator("circle")).toHaveCount(dayCount);
      await expect(page.getByText(`of ${dayCount}`, { exact: true })).toBeVisible();

      // Exactly one ink dot, and it is the biggest.
      const radii = await ring.locator("circle").evaluateAll((circles) =>
        circles.map((circle) => ({ r: Number(circle.getAttribute("r")), fill: circle.getAttribute("fill") })),
      );
      const ink = radii.filter((dot) => dot.fill === "var(--ink)");
      expect(ink).toHaveLength(1);
      expect(Math.max(...radii.map((dot) => dot.r))).toBe(ink[0].r);

      // Wait for the one fade-in, then keep the picture for review.
      await expect(ring).toHaveCSS("opacity", "1");
      await ring.locator("xpath=..").screenshot({ path: testInfo.outputPath(`ring-${dayCount}-${colorScheme}.png`) });
    });
  }
}
