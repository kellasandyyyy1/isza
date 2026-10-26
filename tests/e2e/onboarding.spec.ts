import { expect, test, type Page } from "@playwright/test";

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true });
const heading = (page: Page) => page.getByRole("heading", { level: 1 });
const todayButton = (page: Page) => page.locator('button[aria-current="date"]');

// Reads the saved profile and periods straight from IndexedDB.
async function savedData(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ profile: Record<string, unknown> | undefined; periods: Record<string, unknown>[] }>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const tx = request.result.transaction(["profile", "periods"], "readonly");
          const profile = tx.objectStore("profile").get("me");
          const periods = tx.objectStore("periods").getAll();
          tx.oncomplete = () => resolve({ profile: profile.result, periods: periods.result });
        };
      }),
  );
}

test("completes onboarding, saves the answers and lands on /today", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(heading(page)).toHaveText("Your cycle, your rhythm.");
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await page.getByRole("button", { name: "Get started" }).click();

  // Goals: Next waits for at least one goal.
  await expect(heading(page)).toHaveText("What brings you to Isza?");
  await expect(next(page)).toBeDisabled();
  await page.getByRole("button", { name: "Train smarter" }).click();
  await page.getByRole("button", { name: "Plan my energy" }).click();
  await expect(next(page)).toBeEnabled();
  await next(page).click();

  // Last period: today is highlighted and future days are disabled.
  await expect(next(page)).toBeDisabled();
  await todayButton(page).click();
  await next(page).click();

  // Cycle length: 28 by default, one more makes 29.
  await page.getByRole("button", { name: "One day more" }).click();
  await expect(page.locator("output")).toContainText("29");
  await next(page).click();

  // Period length: not sure.
  await page.getByRole("button", { name: "Not sure" }).click();
  await expect(page.getByRole("button", { name: "One day more" })).toBeDisabled();
  await next(page).click();

  // Contraception: required, with the note under the hormonal options.
  await expect(next(page)).toBeDisabled();
  await expect(page.getByText("Isza will track symptoms and energy without ovulation predictions.")).toHaveCount(2);
  await page.getByRole("radio", { name: /^None/ }).check({ force: true });
  await next(page).click();

  // Activity: required.
  await expect(next(page)).toBeDisabled();
  await page.getByRole("radio", { name: "Very active" }).check({ force: true });
  await next(page).click();

  // Workouts: optional.
  await expect(next(page)).toBeEnabled();
  await page.getByRole("button", { name: "Strength" }).click();
  await next(page).click();

  // Privacy: the checkbox enables the final button.
  await expect(heading(page)).toHaveText("Your data stays with you.");
  await expect(page.getByText("Your data stays on this device. We never sell or share it.")).toBeVisible();
  await expect(page.getByText("Isza is not a medical device or a contraceptive.")).toBeVisible();
  const start = page.getByRole("button", { name: "Start using Isza" });
  await expect(start).toBeDisabled();
  await page.getByLabel("I understand").check();
  await start.click();

  await expect(page).toHaveURL(/\/today$/);
  // Today has no page title: its h1 is the greeting.
  await expect(heading(page)).toHaveText(/^Good (morning|afternoon|evening)/);

  const { profile, periods } = await savedData(page);
  expect(profile).toMatchObject({
    goals: ["train", "energy"],
    typicalCycleLength: 29,
    typicalPeriodLength: null,
    contraception: "none",
    activityLevel: "high",
    workoutTypes: ["strength"],
    onboardingComplete: true,
  });
  expect(periods).toHaveLength(1);
  expect(periods[0]).toMatchObject({ endDate: null });
});

test("Back keeps earlier answers", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "Understand symptoms" }).click();
  await next(page).click();
  await todayButton(page).click();
  await next(page).click();
  await page.getByRole("button", { name: "One day fewer" }).click();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(todayButton(page)).toHaveAttribute("aria-pressed", "true");
  await expect(next(page)).toBeEnabled();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("button", { name: "Understand symptoms" })).toHaveAttribute("aria-pressed", "true");

  await next(page).click();
  await next(page).click();
  await expect(page.locator("output")).toContainText("27");
});

test("I don't remember skips the date and leaves it empty", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "Train smarter" }).click();
  await next(page).click();
  await page.getByRole("button", { name: "I don't remember" }).click();
  await expect(heading(page)).toHaveText("How long is your usual cycle?");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(next(page)).toBeDisabled();
});

test.describe("small phone 360x640", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("every screen fits without scrolling", async ({ page }) => {
    const assertFits = async () => {
      const overflow = await page.evaluate(() => {
        const main = document.querySelector("main");
        const pageOverflow = document.documentElement.scrollHeight - window.innerHeight;
        return Math.max(pageOverflow, main ? main.scrollHeight - main.clientHeight : 0);
      });
      expect(overflow, await heading(page).textContent() ?? "").toBeLessThanOrEqual(0);
    };

    await page.goto("/onboarding");
    await assertFits();
    await page.getByRole("button", { name: "Get started" }).click();
    await page.getByRole("button", { name: "Train smarter" }).click();
    for (let screen = 0; screen < 7; screen++) {
      await assertFits();
      if (screen === 1) await todayButton(page).click();
      if (screen === 4) await page.getByRole("radio", { name: /^Pill/ }).check({ force: true });
      if (screen === 5) await page.getByRole("radio", { name: "Light" }).check({ force: true });
      await next(page).click();
    }
    await expect(heading(page)).toHaveText("Your data stays with you.");
    await assertFits();
  });
});
