import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { format } from "date-fns";
import { completeOnboarding, loadDemoData } from "./helpers";

test.use({ viewport: { width: 360, height: 640 } });

async function openInsights(page: Page) {
  await page.goto("/insights");
  await expect(page.getByRole("tab", { name: "Patterns" })).toHaveAttribute("aria-selected", "true");
}

test("patterns: insights from the demo data, 5 at a time", async ({ page }) => {
  await loadDemoData(page);
  await openInsights(page);
  const patterns = page.getByRole("region", { name: "Your patterns" });
  await expect(patterns.getByText("Cramps often shows up in your menstrual phase (4 of your last 4 cycles).")).toBeVisible();
  const cards = patterns.locator("p.text-body");
  await expect(cards).toHaveCount(5);
  const showMore = page.getByRole("button", { name: "Show more" });
  await showMore.click();
  expect(await cards.count()).toBeGreaterThan(5);
  while (await showMore.isVisible()) await showMore.click();
  await expect(patterns.getByText(/^Your energy averages \d\.\d of 5 in your ovulatory phase\.$/)).toBeVisible();
});

test("patterns: empty state with cycle progress", async ({ page }) => {
  await completeOnboarding(page);
  await openInsights(page);
  await expect(page.getByText("Your patterns appear after 2 cycles of check-ins.")).toBeVisible();
  await expect(page.getByText("Cycle 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  await expect(page.getByRole("dialog", { name: "Today's check-in" })).toBeVisible();
});

test("cycles: summary and the last cycles as bars", async ({ page }) => {
  await loadDemoData(page);
  await openInsights(page);
  await page.getByRole("tab", { name: "Cycles" }).click();
  const stat = (label: string) => page.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd");
  await expect(stat("Average cycle")).toHaveText("28.5 days");
  await expect(stat("Usual range")).toHaveText("27 to 30 days");
  await expect(stat("Average period")).toHaveText("5 days");
  await expect(stat("Confidence")).toHaveText("High");

  const chart = page.getByRole("img", { name: /^Last 4 cycles:/ });
  const label = (await chart.getAttribute("aria-label")) ?? "";
  expect([...label.matchAll(/, (\d+) days, period 5 days/g)].map((match) => Number(match[1]))).toEqual([27, 29, 28, 30]);
});

test("report: empty state without a full cycle", async ({ page }) => {
  await completeOnboarding(page);
  await openInsights(page);
  await page.getByRole("tab", { name: "Report" }).click();
  await expect(page.getByText("Your report needs at least one full cycle. Log your periods to start.")).toBeVisible();
});

test("report: creates and downloads the PDF, loading the PDF library only on press", async ({ page }, testInfo) => {
  const pdfRequests: string[] = [];
  page.on("request", (request) => {
    if (/react-pdf|CycleReportDocument/i.test(request.url())) pdfRequests.push(request.url());
  });

  await loadDemoData(page);
  await openInsights(page);
  await page.getByRole("tab", { name: "Report" }).click();
  await expect(page.getByText("Create a summary to bring to your doctor. It is made on this device.")).toBeVisible();
  await page.getByRole("tab", { name: "Last 6 cycles" }).click();
  const notes = page.getByRole("switch", { name: "Include my notes" });
  await expect(notes).not.toBeChecked();
  expect(pdfRequests).toEqual([]);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`isza-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  expect(pdfRequests.length).toBeGreaterThan(0);

  const path = testInfo.outputPath("report.pdf");
  await download.saveAs(path);
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.subarray(-8).toString()).toContain("%%EOF");
  expect(bytes.length).toBeGreaterThan(10_000);
});
