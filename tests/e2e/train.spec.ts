import { expect, test, type Page } from "@playwright/test";
import { format } from "date-fns";
import { completeOnboarding, expectNoVerticalScroll, loadDemoData } from "./helpers";

test.use({ viewport: { width: 360, height: 640 } });

const SUGGESTIONS = {
  Go: "Good day to push. Try strength or intervals.",
  Steady: "Keep it moderate. Steady cardio or technique work.",
  Rest: "Recovery day. Mobility, a walk or full rest.",
};

async function openTrain(page: Page) {
  await page.goto("/train");
  await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
}

test("logs, lists and deletes a workout", async ({ page }) => {
  await completeOnboarding(page);
  await openTrain(page);
  await expectNoVerticalScroll(page);

  await page.getByRole("button", { name: "Log workout" }).click();
  const sheet = page.getByRole("dialog", { name: "Log workout" });
  const fits = await sheet.locator("[data-sheet-body]").evaluate((body) => body.scrollHeight - body.clientHeight);
  expect(fits).toBeLessThanOrEqual(0);

  const save = sheet.getByRole("button", { name: "Save workout" });
  await expect(save).toBeDisabled();
  await sheet.getByRole("button", { name: "HIIT" }).click();
  await sheet.getByRole("button", { name: "5 minutes more" }).click();
  await expect(sheet.getByText("50 min")).toBeVisible();
  await sheet.getByRole("slider", { name: "Effort" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(sheet.getByText("7 of 10")).toBeVisible();
  await sheet.getByRole("button", { name: "Strong" }).click();
  await sheet.getByLabel("Note (optional)").fill("Felt good");
  await expect(sheet.getByText("9/140")).toBeVisible();
  await save.click();

  await expect(page.getByRole("status").filter({ hasText: "Workout saved" })).toBeVisible();
  await expect(sheet).toBeHidden();
  const logged = page.getByRole("region", { name: "Logged today" });
  await expect(logged).toContainText("HIIT");
  await expect(logged).toContainText("50 min, effort 7 of 10, felt strong");

  await page.getByRole("tab", { name: "Log" }).click();
  const row = page.getByRole("list", { name: "Workouts" }).getByRole("listitem");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("HIIT, 50 min, effort 7");

  const dateLabel = format(new Date(), "EEE, MMM d");
  await row.getByRole("button", { name: `Delete HIIT workout from ${dateLabel}` }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this workout?" });
  await expect(confirm).toContainText(`This deletes your HIIT workout from ${dateLabel} (50 min).`);
  await confirm.getByRole("button", { name: "Keep it" }).click();
  await expect(row).toHaveCount(1);

  await row.getByRole("button", { name: /^Delete HIIT workout/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete workout" }).click();
  await expect(page.getByRole("heading", { name: "No workouts yet" })).toBeVisible();
});

test("today tab shows the band suggestion and only the active tab renders", async ({ page }) => {
  await loadDemoData(page);
  await openTrain(page);
  const summary = await page.getByText(/^Readiness \d+, (Go|Steady|Rest)/).textContent();
  const band = summary?.match(/(Go|Steady|Rest)/)?.[1] as keyof typeof SUGGESTIONS;
  await expect(page.getByText(SUGGESTIONS[band], { exact: true })).toBeVisible();
  await expect(page.getByText("Energy is often rising. Good days for strength and learning new skills.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Workouts" })).toHaveCount(0);
  await expectNoVerticalScroll(page);
});

test("the log shows 5 workouts, newest first, then Show more", async ({ page }) => {
  await loadDemoData(page);
  await openTrain(page);
  await page.getByRole("tab", { name: "Log" }).click();
  const rows = page.getByRole("list", { name: "Workouts" }).getByRole("listitem");
  await expect(rows).toHaveCount(5);
  await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "false");

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
