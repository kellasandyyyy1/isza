import { expect, test, type Locator, type Page } from "@playwright/test";
import { completeOnboarding } from "./helpers";

test.use({ viewport: { width: 360, height: 640 } });

async function savedLogsAndPeriods(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ logs: Record<string, unknown>[]; periods: Record<string, unknown>[] }>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const tx = request.result.transaction(["dailyLogs", "periods"], "readonly");
          const logs = tx.objectStore("dailyLogs").getAll();
          const periods = tx.objectStore("periods").getAll();
          tx.oncomplete = () => {
            request.result.close();
            resolve({ logs: logs.result, periods: periods.result });
          };
        };
      }),
  );
}

// Fails if any control in the sheet has no accessible name.
async function expectEveryControlLabelled(sheet: Locator) {
  const snapshot = await sheet.ariaSnapshot();
  expect(snapshot).not.toMatch(/^\s*- (button|switch|textbox|checkbox|radio)( \[[^\]]*\])*:?\s*$/m);
}

async function expectSheetFits(sheet: Locator) {
  const overflow = await sheet
    .locator("[data-sheet-body]")
    .evaluate((body) => body.scrollHeight - body.clientHeight);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("completes a check-in, then shows Edit check-in", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await expect(sheet).toBeVisible();
  await expectSheetFits(sheet);
  await expectEveryControlLabelled(sheet);

  await sheet.getByRole("switch", { name: "My period started today" }).click();
  await sheet.getByRole("button", { name: "Medium" }).click();
  await sheet.getByRole("button", { name: "4", exact: true }).click();
  await sheet.getByRole("button", { name: "Good" }).click();

  // Symptoms view inside the same sheet.
  await sheet.getByRole("button", { name: "Symptoms" }).click();
  await expect(sheet.getByRole("heading", { name: "Symptoms" })).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expectEveryControlLabelled(sheet);
  await sheet.getByRole("button", { name: "Cramps, off" }).click();
  await sheet.getByRole("button", { name: "Cramps, mild" }).click();
  await expect(sheet.getByRole("button", { name: "Cramps, moderate" })).toBeVisible();
  await expect(sheet.getByText("Cramps: moderate")).toBeAttached();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet.getByRole("button", { name: "Symptoms (1)" })).toBeFocused();

  // Details view.
  await sheet.getByRole("button", { name: "More details" }).click();
  await expectEveryControlLabelled(sheet);
  await sheet.getByRole("button", { name: "Half an hour more" }).click();
  await sheet.getByRole("button", { name: "Half an hour more" }).click();
  await expect(sheet.getByText("7.5 hours")).toBeVisible();
  const temperature = sheet.getByLabel("Temperature in °C (optional)");
  await temperature.fill("39");
  await expect(sheet.getByText("Use a value from 35.0 to 38.5.")).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Done" })).toBeDisabled();
  await temperature.fill("36.6");
  await sheet.getByRole("button", { name: "Negative" }).click();
  await sheet.getByLabel("Note").fill("Felt fine");
  await expect(sheet.getByText("9/280")).toBeVisible();
  await sheet.getByRole("button", { name: "Done" }).click();

  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Check-in saved" })).toBeVisible();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Edit check-in" })).toBeVisible();
  // The period started today, so the hero switches from no-data to day 1.
  await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Menstrual", { exact: true })).toBeVisible();

  const { logs, periods } = await savedLogsAndPeriods(page);
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({
    bleeding: "medium",
    energy: 4,
    mood: "good",
    symptoms: [{ key: "cramps", severity: 2 }],
    sleepHours: 7.5,
    bbt: 36.6,
    lhTest: "negative",
    note: "Felt fine",
  });
  expect(periods).toHaveLength(1);
  expect(periods[0]).toMatchObject({ endDate: null });
});

test("saving twice on the same day updates the existing log", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  let sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await sheet.getByRole("button", { name: "Light" }).click();
  await sheet.getByRole("button", { name: "4", exact: true }).click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await expect(sheet).toBeHidden();

  await page.getByRole("button", { name: "Edit check-in" }).click();
  sheet = page.getByRole("dialog", { name: "Today's check-in" });
  // Pre-filled from the saved log.
  await expect(sheet.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
  await expect(sheet.getByRole("button", { name: "4", exact: true })).toHaveAttribute("aria-pressed", "true");
  await sheet.getByRole("button", { name: "2", exact: true }).click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await expect(sheet).toBeHidden();

  const { logs } = await savedLogsAndPeriods(page);
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({ bleeding: "light", energy: 2 });
});

test("turning off a saved period start asks first, inside the same sheet", async ({ page }) => {
  await completeOnboarding(page, { periodStartsToday: true });
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  const periodSwitch = sheet.getByRole("switch", { name: "My period started today" });
  await expect(periodSwitch).toBeChecked();

  await periodSwitch.click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await expect(sheet.getByRole("heading", { name: "Remove this period start?" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await sheet.getByRole("button", { name: "Keep the period" }).click();
  await expect(periodSwitch).toBeChecked();

  await periodSwitch.click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await sheet.getByRole("button", { name: "Remove period and save" }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("heading", { name: "Let's find your rhythm" })).toBeVisible();
  const { logs, periods } = await savedLogsAndPeriods(page);
  expect(periods).toEqual([]);
  expect(logs).toHaveLength(1);
});

test("an open period offers 'My period ended today'", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  let sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await sheet.getByRole("switch", { name: "My period started today" }).click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await expect(sheet).toBeHidden();

  // Started today, so the same day still shows the started switch, on.
  await page.getByRole("button", { name: "Edit check-in" }).click();
  sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await expect(sheet.getByRole("switch", { name: "My period started today" })).toBeChecked();
});

test("works with the keyboard alone", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Log today's check-in" }).focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await expect(sheet).toBeVisible();

  await sheet.getByRole("switch", { name: "My period started today" }).focus();
  await page.keyboard.press("Space");
  await expect(sheet.getByRole("switch", { name: "My period started today" })).toBeChecked();

  await sheet.getByRole("button", { name: "Heavy", exact: true }).focus();
  await page.keyboard.press("Enter");
  await sheet.getByRole("button", { name: "3", exact: true }).focus();
  await page.keyboard.press("Space");
  await sheet.getByRole("button", { name: "Okay" }).focus();
  await page.keyboard.press("Enter");

  await sheet.getByRole("button", { name: "Symptoms" }).focus();
  await page.keyboard.press("Enter");
  await expect(sheet.getByRole("heading", { name: "Symptoms" })).toBeFocused();
  // The back button sits before the heading, so Tab from the heading goes straight into the grid.
  await page.keyboard.press("Tab");
  await expect(sheet.getByRole("button", { name: "Cramps, off" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(sheet.getByRole("button", { name: "Cramps, mild" })).toBeFocused();
  await sheet.getByRole("button", { name: "Back to check-in" }).focus();
  await page.keyboard.press("Enter");

  await sheet.getByRole("button", { name: "More details" }).focus();
  await page.keyboard.press("Enter");
  await sheet.getByLabel("Note").focus();
  await page.keyboard.type("Typed with keys");
  await sheet.getByRole("button", { name: "Done" }).focus();
  await page.keyboard.press("Enter");

  await sheet.getByRole("button", { name: "Save check-in" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Edit check-in" })).toBeVisible();

  const { logs } = await savedLogsAndPeriods(page);
  expect(logs[0]).toMatchObject({
    bleeding: "heavy",
    energy: 3,
    mood: "okay",
    symptoms: [{ key: "cramps", severity: 1 }],
    note: "Typed with keys",
  });
});
