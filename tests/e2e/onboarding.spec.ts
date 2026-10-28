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
  await expect(heading(page)).toHaveText("Because “why am I like this today” deserves an answer.");
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await page.getByRole("button", { name: "Get started" }).click();

  // Name: optional, Next is ready with the field empty.
  await expect(heading(page)).toHaveText("What should we call you?");
  await expect(next(page)).toBeEnabled();
  await page.getByLabel("Your name").fill("  Mia ");
  await next(page).click();

  // Goals: Next waits for at least one goal.
  await expect(heading(page)).toHaveText("What brings you to Iszacycle?");
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
  await expect(page.getByText("Iszacycle will track symptoms and energy without ovulation predictions.")).toHaveCount(2);
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
  await expect(page.getByText("Iszacycle is not a medical device or a contraceptive.")).toBeVisible();
  const start = page.getByRole("button", { name: "Start using Iszacycle" });
  await expect(start).toBeDisabled();
  await page.getByLabel("I understand").check();
  await start.click();

  await expect(page).toHaveURL(/\/today$/);
  // Today has no page title: its h1 is the greeting.
  await expect(heading(page)).toHaveText(/^Good (morning|afternoon|evening)/);

  const { profile, periods } = await savedData(page);
  expect(profile).toMatchObject({
    name: "Mia",
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

test("Skip leaves the name empty, and Back shows the field empty", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Your name").fill("Mia");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(heading(page)).toHaveText("What brings you to Iszacycle?");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Your name")).toHaveValue("");
});

test("Back keeps earlier answers", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
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
  await page.getByRole("button", { name: "Skip" }).click();
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
    await assertFits();
    await page.getByRole("button", { name: "Skip" }).click();
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

test("the welcome mascot pops in once, softly, with no overshoot", async ({ page }) => {
  // Watch her scale from the first frame: it only ever grows toward 1, never past it.
  await page.addInitScript(() => {
    const scales: number[] = [];
    (window as unknown as { mascotScales: number[] }).mascotScales = scales;
    const sample = () => {
      const box = document.querySelector('img[src*="mascot-validation"]')?.closest("[aria-hidden='true']");
      if (box) scales.push(new DOMMatrix(getComputedStyle(box).transform).a);
      if (scales.length < 90) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto("/onboarding");
  await expect(page.locator('img[src*="mascot-validation"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { mascotScales: number[] }).mascotScales.length)).toBe(90);
  const scales = await page.evaluate(() => (window as unknown as { mascotScales: number[] }).mascotScales);
  expect(Math.min(...scales)).toBeLessThan(1);
  expect(Math.max(...scales)).toBeLessThanOrEqual(1.0001);
  expect(scales.at(-1)).toBeCloseTo(1, 3);
  // No progress or Back on the welcome screen: just the one button.
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
});

test("the last screen shows the privacy promise, the fun fact and one tap to agree", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByText("About you")).toBeVisible();
  await expect(page.getByText("2 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("3 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Train smarter" }).click();
  await expect(page.getByRole("button", { name: "Train smarter" })).toHaveAttribute("aria-pressed", "true");
  await next(page).click();
  await page.getByRole("button", { name: "I don't remember" }).click();
  await next(page).click();
  await next(page).click();
  await page.getByRole("radio", { name: /^None/ }).check({ force: true });
  await next(page).click();
  await page.getByRole("radio", { name: "Light" }).check({ force: true });
  await next(page).click();
  await next(page).click();
  await expect(page.getByText("Almost done")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "A little fun fact" })).toBeVisible();
  await expect(page.getByText("Iszacycle is named after my girlfriend.", { exact: false })).toBeVisible();
  await expect(page.getByText("The mascot is based on her, in her favorite black gym outfit.")).toBeVisible();
  await expect(page.getByText("It is also for every woman who wants to understand her body better.")).toBeVisible();
  // The 3D shield and heart icons, one per card.
  await expect(page.locator('main img[src*="/art-icons/security-"]')).toBeVisible();
  await expect(page.locator('main img[src*="/art-icons/heart-"]')).toBeVisible();
  // A tap anywhere on the row agrees.
  await page.getByText("I understand").click();
  await expect(page.getByLabel("I understand")).toBeChecked();
  await expect(page.getByRole("button", { name: "Start using Iszacycle" })).toBeEnabled();
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`screenshots at ${viewport.width}x${viewport.height}, ${colorScheme}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      await page.goto("/onboarding");
      await page.waitForTimeout(700);
      await page.screenshot({ path: testInfo.outputPath(`welcome-${viewport.width}-${colorScheme}.png`) });
      await page.getByRole("button", { name: "Get started" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: testInfo.outputPath(`name-${viewport.width}-${colorScheme}.png`) });
      await page.getByRole("button", { name: "Skip" }).click();
      await page.getByRole("button", { name: "Train smarter" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: testInfo.outputPath(`goals-${viewport.width}-${colorScheme}.png`) });
      await next(page).click();
      await page.getByRole("button", { name: "I don't remember" }).click();
      await next(page).click();
      await next(page).click();
      await page.getByRole("radio", { name: /^None/ }).check({ force: true });
      await next(page).click();
      await page.getByRole("radio", { name: "Light" }).check({ force: true });
      await next(page).click();
      await page.getByRole("button", { name: "Strength" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: testInfo.outputPath(`workouts-${viewport.width}-${colorScheme}.png`) });
      await next(page).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: testInfo.outputPath(`privacy-${viewport.width}-${colorScheme}.png`) });
    });
  }
}

for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`the welcome copy shows in full at ${viewport.width}x${viewport.height}, with no scroll`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/onboarding");
    const title = heading(page);
    await expect(title).toHaveText("Because “why am I like this today” deserves an answer.");
    await expect(page.getByText("Iszacycle matches your training, food and energy to your cycle.")).toBeVisible();
    // No wordmark above the mascot.
    await expect(page.getByText("iszacycle", { exact: true })).toHaveCount(0);
    await expect(page.locator('img[src*="mascot-validation"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();

    const measured = await title.evaluate((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        fontSize: parseFloat(style.fontSize),
        lines: Math.round(box.height / parseFloat(style.lineHeight)),
        // Not cut off: no clamp, no ellipsis, nothing hidden inside, and the whole box on screen.
        // 1px of slack: the glyphs' ink can round 1px past the line box without anything being cut.
        clipped: element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1,
        clamp: style.webkitLineClamp,
        ellipsis: style.textOverflow,
        onScreen: box.top >= 0 && box.bottom <= window.innerHeight,
      };
    });
    // Never below the h1 size (24px).
    expect(measured.fontSize).toBeGreaterThanOrEqual(24);
    if (viewport.width === 360) expect(measured.lines).toBe(3);
    expect(measured).toMatchObject({ clipped: false, clamp: "none", ellipsis: "clip", onScreen: true });

    const overflow = await page.evaluate(() => {
      const main = document.querySelector("main");
      return Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        main ? main.scrollHeight - main.clientHeight : 0,
      );
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
