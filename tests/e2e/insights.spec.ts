import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import { completeOnboarding, loadDemoData, putRecords } from "./helpers";

test.use({ viewport: { width: 360, height: 640 } });

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");

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

// A check-in for the day offset from today, with the given fields.
function checkIn(offset: number, fields: Record<string, unknown> = {}) {
  return {
    date: day(offset),
    bleeding: "none",
    energy: null,
    mood: null,
    symptoms: [],
    sleepHours: null,
    bbt: null,
    lhTest: null,
    note: null,
    updatedAt: `${day(offset)}T20:00:00.000Z`,
    ...fields,
  };
}

test("patterns with no check-ins: one progress message, counting up, and a summary waiting for the first", async ({
  page,
}) => {
  await completeOnboarding(page, { periodStartsToday: true });
  await openInsights(page);
  const tab = page.getByRole("tabpanel");

  await expect(tab.getByRole("heading", { name: "Your first cycle" })).toBeVisible();
  // One period so far, so the cycle length is an estimate: the label is the day alone.
  const bar = tab.getByRole("progressbar", { name: "This cycle" });
  await expect(bar).toHaveAttribute("aria-valuetext", "Day 1");
  expect(await bar.locator("div").evaluate((fill) => fill.getBoundingClientRect().width)).toBeGreaterThan(0);
  // The next period is 28 days away, and the first patterns one 28-day cycle after that.
  await expect(
    tab.getByText(`Patterns appear after your second period, around ${format(addDays(new Date(), 56), "MMM d")}.`),
  ).toBeVisible();

  // The only "not yet" on the tab, and nothing counting down.
  await expect(tab.getByText(/Patterns appear/)).toHaveCount(1);
  await expect(tab.getByText(/Log 3 check-ins/)).toHaveCount(0);
  await expect(tab.getByText(/0 of/)).toHaveCount(0);
  await expect(tab.getByText(/estimate/i)).toHaveCount(0);

  const summary = tab.getByRole("region", { name: "This cycle so far" });
  await expect(summary.getByText("Your check-ins will show up here.")).toBeVisible();
  await expect(tab.getByText("You checked in today")).toHaveCount(0);
  await tab.getByRole("button", { name: "Log today's check-in" }).click();
  await expect(page.getByRole("dialog", { name: "Today's check-in" })).toBeVisible();
});

test.describe("tall phone 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("patterns with 4 check-ins: her mood, energy, symptoms and counts, then the example", async ({ page }) => {
    await completeOnboarding(page);
    // Two periods: one completed cycle, so this is her second cycle, on day 8 of about 28.
    await putRecords(page, "periods", [
      { id: 1, startDate: day(-35), endDate: day(-31) },
      { id: 2, startDate: day(-7), endDate: day(-6) },
    ]);
    await putRecords(page, "dailyLogs", [
      checkIn(-7, { bleeding: "medium", energy: 2, mood: "okay", symptoms: [{ key: "cramps", severity: 3 }] }),
      checkIn(-6, {
        bleeding: "light",
        energy: 3,
        mood: "okay",
        symptoms: [
          { key: "cramps", severity: 2 },
          { key: "fatigue", severity: 1 },
        ],
      }),
      checkIn(-3, {
        energy: 4,
        mood: "good",
        symptoms: [
          { key: "cramps", severity: 1 },
          { key: "headache", severity: 1 },
        ],
      }),
      checkIn(-1, { energy: 4, mood: "okay", symptoms: [{ key: "bloating", severity: 1 }] }),
      // The last cycle: not counted.
      checkIn(-10, { energy: 1, mood: "bad", symptoms: [{ key: "acne", severity: 3 }] }),
    ]);
    await putRecords(page, "workouts", [
      { id: 1, date: day(-2), type: "strength", durationMin: 40, rpe: 6, feel: "strong", note: null },
    ]);
    await openInsights(page);
    const tab = page.getByRole("tabpanel");

    await expect(tab.getByRole("heading", { name: "Your second cycle" })).toBeVisible();
    await expect(tab.getByRole("progressbar", { name: "This cycle" })).toHaveAttribute("aria-valuetext", /^Day 8/);

    const summary = tab.getByRole("region", { name: "This cycle so far" });
    const row = (label: string) => summary.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd");
    await expect(row("Check-ins")).toHaveText("4");
    await expect(row("Mood")).toContainText("Mostly okay");
    await expect(row("Mood").getByRole("img", { name: "Moods logged: great 0, good 1, okay 3, low 0, bad 0" })).toBeVisible();
    await expect(row("Average energy")).toHaveText("3.3 of 5");
    // Up to 3 chips, then "+n more". Cramps leads on days; the others tie and keep the check-in's order.
    await expect(row("Symptoms").locator("span")).toHaveText(["Cramps, 3 days", "Headache, 1 day", "Bloating, 1 day", "+1 more"]);
    await expect(row("Period days")).toHaveText("2");
    await expect(row("Workouts")).toHaveText("1");

    // The example: a faded normal card below her summary, with a chip, no dashed border and nothing to tap.
    const example = tab.getByRole("region", { name: "Example of a future insight" });
    await expect(example.getByText("Example", { exact: true })).toBeVisible();
    await expect(example).not.toHaveCSS("border-style", "dashed");
    await expect(example.getByRole("button")).toHaveCount(0);

    // Cards 16px apart, stacked from the top, reaching two thirds down the screen.
    const progress = tab.getByRole("region", { name: "Pattern progress" });
    const [progressBox, summaryBox, exampleBox] = await Promise.all([
      progress.boundingBox(),
      summary.boundingBox(),
      example.boundingBox(),
    ]);
    if (!progressBox || !summaryBox || !exampleBox) throw new Error("A card is not on screen.");
    expect(Math.round(summaryBox.y - (progressBox.y + progressBox.height))).toBe(16);
    expect(Math.round(exampleBox.y - (summaryBox.y + summaryBox.height))).toBe(16);
    expect(exampleBox.y + exampleBox.height).toBeGreaterThanOrEqual((844 * 2) / 3);
    await expect(tab.getByText(/Log 3 check-ins|0 of/)).toHaveCount(0);
  });
});

test("cycles before a second period: the history line and the current cycle", async ({ page }) => {
  await completeOnboarding(page, { periodStartsToday: true });
  await openInsights(page);
  await page.getByRole("tab", { name: "Cycles" }).click();
  await expect(page.getByText("Your cycle history appears after your second period.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Current cycle" })).toContainText(
    `Started ${format(new Date(), "MMM d")} · day 1`,
  );
});

test("cycles with no period at all: the history line and one way to start", async ({ page }) => {
  await completeOnboarding(page);
  await openInsights(page);
  await page.getByRole("tab", { name: "Cycles" }).click();
  await expect(page.getByText("Your cycle history appears after your second period.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Current cycle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log period" })).toBeVisible();
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

test("report without a full cycle: the reason, and Create PDF visible but disabled", async ({ page }) => {
  await completeOnboarding(page, { periodStartsToday: true });
  await openInsights(page);
  await page.getByRole("tab", { name: "Report" }).click();
  await expect(page.getByText("Create a doctor summary once you have logged a full cycle.")).toBeVisible();
  const create = page.getByRole("button", { name: "Create PDF" });
  await expect(create).toBeDisabled();
  await expect(create).toHaveAccessibleDescription("Create a doctor summary once you have logged a full cycle.");
  // The tabs themselves stay available.
  for (const name of ["Patterns", "Cycles", "Report"]) await expect(page.getByRole("tab", { name })).toBeEnabled();
});

test("report: creates and downloads the PDF, loading the PDF library only on press", async ({ page }, testInfo) => {
  // Production chunk names are hashed, so the PDF library shows up as script chunks that load only on press.
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });

  await loadDemoData(page);
  await openInsights(page);
  await page.getByRole("tab", { name: "Report" }).click();
  await expect(page.getByText("Create a summary to bring to your doctor. It is made on this device.")).toBeVisible();
  await page.getByRole("tab", { name: "Last 6 cycles" }).click();
  const notes = page.getByRole("switch", { name: "Include my notes" });
  await expect(notes).not.toBeChecked();
  await page.waitForLoadState("networkidle");
  const loadedBeforePress = scripts.length;

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`iszacycle-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  expect(scripts.length).toBeGreaterThan(loadedBeforePress);

  const path = testInfo.outputPath("report.pdf");
  await download.saveAs(path);
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.subarray(-8).toString()).toContain("%%EOF");
  expect(bytes.length).toBeGreaterThan(10_000);
});
