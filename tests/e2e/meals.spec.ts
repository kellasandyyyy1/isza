import { expect, test, type Page } from "@playwright/test";
import { MEALS } from "../../src/content/meals";
import { completeOnboarding, loadDemoData } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

const mealById = (id: string | null) => MEALS.find((meal) => meal.id === id);

// The Food card opens today's meal. The card itself shows only its two lines, so the meal is read in the sheet.
const foodButton = (page: Page) => page.getByRole("button", { name: "Food", exact: true });
const sheetMeal = (page: Page) => page.getByRole("dialog").locator("[data-meal]");

async function openFood(page: Page) {
  await page.goto("/today");
  await foodButton(page).click();
  await expect(sheetMeal(page)).toBeVisible();
}

// Today's meal id, read from the Food sheet, which closes again after.
async function mealOfTheDay(page: Page) {
  await openFood(page);
  const id = await sheetMeal(page).getAttribute("data-meal");
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return id;
}

// The day's meal is logged as shown the first time it appears. Waits for that write, as a person would by
// using the app for more than a moment, so a reload or the next day reads the saved history.
async function waitForLoggedMeal(page: Page, mealId: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          new Promise<boolean>((resolve) => {
            const request = indexedDB.open("isza");
            request.onsuccess = () => {
              const all = request.result.transaction("mealHistory").objectStore("mealHistory").getAll();
              all.onsuccess = () => {
                request.result.close();
                resolve((all.result as { mealId: string }[]).some((row) => row.mealId === id));
              };
            };
          }),
        mealId,
      ),
    )
    .toBe(true);
}

async function openPreferences(page: Page) {
  await page.goto("/me");
  await page.getByRole("button", { name: /^Meal preferences/ }).click();
  return page.getByRole("dialog", { name: "Meal preferences" });
}

test("opening the app on 7 days in a row gives 7 different meals in both styles", async ({ page }) => {
  // 14 page loads, each opening and closing the Food sheet: about 2.5s apiece, so more than the 30s default.
  test.setTimeout(60_000);
  await page.clock.setFixedTime(new Date(2026, 10, 2, 9));
  await loadDemoData(page);
  const seen: string[] = [];
  for (let day = 0; day < 7; day++) {
    await page.clock.setFixedTime(new Date(2026, 10, 2 + day, 9));
    const id = await mealOfTheDay(page);
    expect(mealById(id), `day ${day}: ${id}`).toBeDefined();
    seen.push(id ?? "");
    await waitForLoggedMeal(page, id ?? "");
    // A reload the same day keeps the same meal.
    expect(await mealOfTheDay(page)).toBe(id);
  }
  expect(new Set(seen).size).toBe(7);
  expect(new Set(seen.map((id) => mealById(id)?.cuisine)).size).toBe(2);
});

test("the Food sheet has the card's two lines, then the meal with its recipe and three actions", async ({
  page,
}) => {
  await loadDemoData(page);
  await openFood(page);
  const meal = sheetMeal(page);
  // The phase line at the top, then the meal's time, the price labeled as an estimate, and one nutrient chip.
  await expect(meal).toContainText("Fuel training with protein and complex carbs like rice, oats and sweet potato.");
  await expect(meal).toContainText(/\d+ min/);
  await expect(meal).toContainText(/about ₱\d+ per serving \(estimate\)/);
  await expect(meal).toContainText(/-rich|Hydrating|Slow-release carbs/);

  const first = mealById(await meal.getAttribute("data-meal"));
  if (!first) throw new Error("No meal in the Food sheet.");
  let sheet = page.getByRole("dialog", { name: first.tagalogName ?? first.name });
  await expect(sheet.getByRole("heading", { name: "Ingredients" })).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Steps" })).toBeVisible();
  await expect(sheet.locator("ol li")).toHaveCount(first.steps.length);
  await expect(sheet.locator("ul li")).toHaveCount(first.ingredients.length);

  // Show another: a different meal, the sheet stays open on it.
  await sheet.getByRole("button", { name: "Show another" }).click();
  await expect(sheet).toBeHidden();
  const second = mealById(await sheetMeal(page).getAttribute("data-meal"));
  expect(second?.id).not.toBe(first.id);
  sheet = page.getByRole("dialog", { name: second?.tagalogName ?? second?.name });
  await expect(sheet).toBeVisible();

  // Not for me: hidden from now on, and listed under Me so it can come back.
  await sheet.getByRole("button", { name: "Not for me" }).click();
  await expect(sheet).toBeHidden();
  const third = mealById(await sheetMeal(page).getAttribute("data-meal"));
  expect([first.id, second?.id]).not.toContain(third?.id);
  sheet = page.getByRole("dialog", { name: third?.tagalogName ?? third?.name });
  await sheet.getByRole("button", { name: "Cooked this" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Marked as cooked" })).toBeVisible();

  const preferences = await openPreferences(page);
  const label = second?.tagalogName ?? second?.name ?? "";
  await expect(preferences.getByText(label, { exact: true })).toBeVisible();
  await preferences.getByRole("button", { name: `Bring back ${label}` }).click();
  await expect(preferences.getByText("Meals you skip with Not for me show up here.")).toBeVisible();
});

test("Budget Tight shows the cheapest tier and Style Filipino shows Filipino dishes", async ({ page }) => {
  await completeOnboarding(page);
  const preferences = await openPreferences(page);
  await preferences.getByRole("tab", { name: "Tight" }).click();
  await preferences.getByRole("tab", { name: "Filipino" }).click();
  await expect(preferences.getByRole("tab", { name: "Tight" })).toHaveAttribute("aria-selected", "true");
  await preferences.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: /^Meal preferences/ })).toContainText("Tight, Filipino");

  for (let day = 0; day < 5; day++) {
    await page.clock.setFixedTime(new Date(Date.now() + day * 86_400_000));
    const meal = mealById(await mealOfTheDay(page));
    expect(meal?.costTier, meal?.id).toBe(1);
    expect(meal?.cuisine, meal?.id).toBe("filipino");
  }
});

test("on a crowded Today, tapping the Food card still opens the meal", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/today");
  // A period still open after 40 days: the period pill makes Today crowded.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const start = new Date(Date.now() - 40 * 86_400_000).toISOString().slice(0, 10);
          const tx = request.result.transaction("periods", "readwrite");
          tx.objectStore("periods").put({ id: 1, startDate: start, endDate: null });
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.goto("/today");
  await expect(page.getByRole("button", { name: /^Period (started|ended) today\?$/ })).toBeVisible();
  await foodButton(page).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Ingredients" })).toBeVisible();
});

test("with Daily meal ideas off, the Food card opens its phase tip instead of a meal", async ({ page }) => {
  await loadDemoData(page);
  await page.goto("/me");
  const toggle = page.getByRole("switch", { name: "Daily meal ideas" });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();

  await page.goto("/today");
  await expect(page.getByRole("button", { name: "Food", exact: true })).toBeVisible();
  await expect(page.locator("[data-meal]")).toHaveCount(0);
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Food" })).toContainText("Fuel training with protein");
});
