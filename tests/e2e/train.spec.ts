import { expect, test, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import { completeOnboarding, expectNoVerticalScroll, loadDemoData } from "./helpers";

test.use({ viewport: { width: 360, height: 640 } });

const SUGGESTIONS = {
  Go: "Good day to push. Try strength or intervals.",
  Steady: "Keep it moderate. Steady cardio or technique work.",
  Rest: "Recovery day. Mobility, a walk or full rest.",
};

// The Plan tab's suggested session for each band, from src/content/training.ts.
const SESSIONS = {
  Go: { title: "Heavy strength", duration: "45 min", effort: "Effort 7 to 8 of 10", type: "Strength", rpe: "7 of 10" },
  Steady: { title: "Steady cardio", duration: "35 min", effort: "Effort 5 to 6 of 10", type: "Cardio", rpe: "5 of 10" },
  Rest: { title: "Mobility and a walk", duration: "20 min", effort: "Effort 2 to 3 of 10", type: "Mobility", rpe: "2 of 10" },
};
const LIGHTER_NOTE = "Your readiness is low today. You may prefer something lighter.";
const todayName = format(new Date(), "EEEE");

async function openTrain(page: Page) {
  await page.goto("/train");
  await expect(page.getByRole("tab", { name: "Plan" })).toHaveAttribute("aria-selected", "true");
}

async function readBand(page: Page) {
  const summary = await page.getByText(/^Readiness \d+, (Go|Steady|Rest)$/).textContent();
  return summary?.match(/(Go|Steady|Rest)/)?.[1] as keyof typeof SESSIONS;
}

test("a swap chip, Start this workout, then lists and deletes the workout", async ({ page }) => {
  await completeOnboarding(page);
  await openTrain(page);
  await expectNoVerticalScroll(page);
  const band = await readBand(page);
  const today = page.getByRole("list", { name: "This week" }).getByRole("listitem", { name: new RegExp(`^${todayName},`) });
  await expect(today).toHaveAttribute("aria-label", /no workout$/);

  // HIIT replaces the card with its preset. The lighter note shows only on a Rest day.
  const card = page.getByRole("region", { name: "Suggested session" });
  await page.getByRole("group", { name: "Swap workout" }).getByRole("button", { name: "HIIT" }).click();
  await expect(card.getByText("HIIT", { exact: true })).toBeVisible();
  await expect(card.getByText("25 min", { exact: true })).toBeVisible();
  await expect(card.getByText("Effort 8 of 10", { exact: true })).toBeVisible();
  await expect(page.getByText(LIGHTER_NOTE)).toHaveCount(band === "Rest" ? 1 : 0);
  await expectNoVerticalScroll(page);

  await card.getByRole("button", { name: "Start this workout" }).click();
  const sheet = page.getByRole("dialog", { name: "Log workout" });
  const fits = await sheet.locator("[data-sheet-body]").evaluate((body) => body.scrollHeight - body.clientHeight);
  expect(fits).toBeLessThanOrEqual(0);
  await expect(sheet.getByRole("button", { name: "HIIT" })).toHaveAttribute("aria-pressed", "true");
  await expect(sheet.getByText("25 min")).toBeVisible();
  await expect(sheet.getByText("8 of 10")).toBeVisible();

  const save = sheet.getByRole("button", { name: "Save workout" });
  await sheet.getByRole("button", { name: "5 minutes more" }).click();
  await expect(sheet.getByText("30 min")).toBeVisible();
  await sheet.getByRole("slider", { name: "Effort" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(sheet.getByText("7 of 10")).toBeVisible();
  await sheet.getByRole("button", { name: "Strong" }).click();
  await sheet.getByLabel("Note (optional)").fill("Felt good");
  await expect(sheet.getByText("9/140")).toBeVisible();
  await save.click();

  await expect(page.getByRole("status").filter({ hasText: "Workout saved" })).toBeVisible();
  await expect(sheet).toBeHidden();
  await expect(today).toHaveAttribute("aria-label", /, HIIT logged$/);
  await expect(today).toHaveAttribute("data-workout", "hiit");

  await page.getByRole("tab", { name: "Log" }).click();
  const row = page.getByRole("list", { name: "Workouts" }).getByRole("listitem");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("HIIT, 30 min, effort 7");

  const dateLabel = format(new Date(), "EEE, MMM d");
  await row.getByRole("button", { name: `Delete HIIT workout from ${dateLabel}` }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this workout?" });
  await expect(confirm).toContainText(`This deletes your HIIT workout from ${dateLabel} (30 min).`);
  await confirm.getByRole("button", { name: "Keep it" }).click();
  await expect(row).toHaveCount(1);

  await row.getByRole("button", { name: /^Delete HIIT workout/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete workout" }).click();
  await expect(page.getByRole("heading", { name: "No workouts yet" })).toBeVisible();
});

test("plan tab shows the band's suggested session, prefills the sheet, and only the active tab renders", async ({ page }) => {
  await loadDemoData(page);
  await openTrain(page);
  const band = await readBand(page);
  const session = SESSIONS[band];
  await expect(page.getByText(SUGGESTIONS[band], { exact: true })).toBeVisible();
  const card = page.getByRole("region", { name: "Suggested session" });
  await expect(card.getByText(session.title, { exact: true })).toBeVisible();
  await expect(card.getByText(session.duration, { exact: true })).toBeVisible();
  await expect(card.getByText(session.effort, { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Workouts" })).toHaveCount(0);
  // The last session row is hidden under 700px tall.
  await expect(page.getByRole("region", { name: "Last session" })).toBeHidden();
  await expectNoVerticalScroll(page);

  // Ranges like "7 to 8" start at their lower end.
  await card.getByRole("button", { name: "Start this workout" }).click();
  const sheet = page.getByRole("dialog", { name: "Log workout" });
  await expect(sheet.getByRole("button", { name: session.type })).toHaveAttribute("aria-pressed", "true");
  await expect(sheet.getByText(session.duration)).toBeVisible();
  await expect(sheet.getByText(session.rpe)).toBeVisible();
});

test.describe("mobile 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the week strip matches the demo workouts and the last session shows, without scrolling", async ({ page }) => {
    await loadDemoData(page);
    await openTrain(page);
    // Each day shows a workout exactly when the saved demo data has one on that date.
    const days = page.getByRole("list", { name: "This week" }).getByRole("listitem");
    await expect(days).toHaveCount(7);
    // ISO weekday: Monday is 1.
    const todayIndex = Number(format(new Date(), "i")) - 1;
    const weekDates = Array.from({ length: 7 }, (_, index) => format(addDays(new Date(), index - todayIndex), "yyyy-MM-dd"));
    const savedDates = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const request = indexedDB.open("isza");
          request.onsuccess = () => {
            const all = request.result.transaction("workouts").objectStore("workouts").getAll();
            all.onsuccess = () => resolve((all.result as { date: string }[]).map((workout) => workout.date));
          };
        }),
    );
    const shown = await days.evaluateAll((items) =>
      items.map((item) => ({ label: item.getAttribute("aria-label") ?? "", workout: item.getAttribute("data-workout") })),
    );
    shown.forEach(({ label, workout }, index) => {
      expect(label.endsWith(workout ? " logged" : ", no workout"), label).toBe(true);
      expect(workout !== null, label).toBe(savedDates.includes(weekDates[index]));
    });
    await expect(page.locator('[aria-label="This week"] [aria-current="date"]')).toHaveCount(1);
    await expect(days.nth(todayIndex)).toHaveAttribute("aria-current", "date");

    const last = page.getByRole("region", { name: "Last session" });
    await expect(last).toBeVisible();
    await expect(last).toContainText(/today|yesterday|\d+ days ago/);
    await expectNoVerticalScroll(page);
  });
});

test("the log shows 5 workouts, newest first, then Show more", async ({ page }) => {
  await loadDemoData(page);
  await openTrain(page);
  await page.getByRole("tab", { name: "Log" }).click();
  const rows = page.getByRole("list", { name: "Workouts" }).getByRole("listitem");
  await expect(rows).toHaveCount(5);
  await expect(page.getByRole("tab", { name: "Plan" })).toHaveAttribute("aria-selected", "false");

  const dates = await rows.evaluateAll((items) => items.map((item) => item.querySelector("p + p")?.textContent ?? ""));
  const parsed = dates.map((text) => new Date(`${text.split(/[A-Z][a-z]+$/)[0]} ${new Date().getFullYear()}`).getTime());
  expect([...parsed].sort((a, b) => b - a)).toEqual(parsed);

  await page.getByRole("button", { name: "Show more" }).click();
  await expect(rows).toHaveCount(10);
});

test("progress needs 2 completed cycles with workouts", async ({ page }) => {
  await completeOnboarding(page);
  await openTrain(page);
  await page.getByRole("tab", { name: "Progress" }).click();
  await expect(page.getByText("Log workouts for 2 cycles to see your strongest phase.")).toBeVisible();
});

test("progress shows the strong share per phase and the best window for the demo data", async ({ page }) => {
  await loadDemoData(page);
  await openTrain(page);
  await page.getByRole("tab", { name: "Progress" }).click();
  await expectNoVerticalScroll(page);

  const chart = page.getByRole("img", { name: /^Strong sessions by phase:/ });
  const label = (await chart.getAttribute("aria-label")) ?? "";
  const percents = Object.fromEntries(
    [...label.matchAll(/(Menstrual|Follicular|Ovulatory|Luteal) (\d+)%/g)].map((match) => [match[1], Number(match[2])]),
  );
  expect(Object.keys(percents)).toEqual(["Menstrual", "Follicular", "Ovulatory", "Luteal"]);
  for (const value of Object.values(percents)) {
    await expect(chart.getByText(`${value}%`).first()).toBeAttached();
  }

  // The sentence from insights.ts names the phase with the highest share.
  const sentence = page.getByText(/^You often feel strongest training in your (\w+) phase \((\d+)% of workouts felt strong\)\.$/);
  const text = (await sentence.textContent()) ?? "";
  const [, phase, percent] = text.match(/your (\w+) phase \((\d+)%/) ?? [];
  const best = Object.entries(percents).sort((a, b) => b[1] - a[1])[0];
  expect(phase).toBe(best[0].toLowerCase());
  expect(Number(percent)).toBe(best[1]);
  await expect(page.getByText("From 4 completed cycles.")).toBeVisible();
});
