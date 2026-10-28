import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import { completeOnboarding, loadDemoData, putRecords } from "./helpers";

test.use({ viewport: { width: 360, height: 640 } });

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");

async function openMe(page: Page) {
  await page.goto("/me");
  await expect(page.getByRole("button", { name: "About Iszacycle" })).toBeVisible();
}

async function readSettings(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ key: string; value: unknown }[]>((resolve) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const read = request.result.transaction("settings").objectStore("settings").getAll();
          read.onsuccess = () => {
            request.result.close();
            resolve(read.result);
          };
        };
      }),
  );
}

async function exportBackup(page: Page, name: string, outputPath: (name: string) => string) {
  await page.getByRole("button", { name: "Export data" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`iszacycle-backup-${day(0)}.json`);
  const path = outputPath(name);
  await download.saveAs(path);
  return { path, json: JSON.parse(await readFile(path, "utf8")) as unknown };
}

test("lists the groups and rows", async ({ page }) => {
  await completeOnboarding(page);
  await openMe(page);
  for (const group of ["Daily", "App", "Privacy", "About"]) {
    await expect(page.getByRole("heading", { name: group })).toBeVisible();
  }
  for (const row of ["Reminders", "Supplies", "Profile", "Appearance", "App lock", "Export data", "Import data", "Delete all data", "About Iszacycle"]) {
    const button = page.getByRole("button", { name: new RegExp(`^${row}`) });
    await expect(button).toBeVisible();
    expect((await button.boundingBox())?.height).toBe(48);
  }
  await expect(page.getByRole("switch", { name: "Discreet mode" })).toBeVisible();
  const pageScroll = await page.evaluate(() => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight);
  expect(pageScroll).toBeLessThanOrEqual(0);
});

test("export, delete all and import restores everything exactly", async ({ page }, testInfo) => {
  await loadDemoData(page);
  await openMe(page);
  // Add records the demo does not have, so every table takes part.
  await page.getByRole("button", { name: /^Supplies/ }).click();
  await page.getByRole("button", { name: "Add supply" }).click();
  await page.getByRole("button", { name: "Save supply" }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("switch", { name: "Discreet mode" }).click();

  // The export sheet closes itself after the download starts.
  const before = await exportBackup(page, "before.json", (name) => testInfo.outputPath(name));
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Delete all data" }).click();
  const sheet = page.getByRole("dialog", { name: "Delete all data" });
  await expect(sheet).toContainText("This deletes your profile, periods, check-ins, workouts, supplies, reminders");
  const confirm = sheet.getByRole("button", { name: "Delete all data" });
  await sheet.getByLabel("Type DELETE to confirm").fill("delete");
  await expect(confirm).toBeDisabled();
  await sheet.getByLabel("Type DELETE to confirm").fill("DELETE");
  await confirm.click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await openMe(page);
  await page.getByRole("button", { name: "Import data" }).click();
  const importSheet = page.getByRole("dialog", { name: "Import data" });
  await importSheet.getByLabel("Choose backup file").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{ not json"),
  });
  await expect(importSheet.getByText("This file is not a valid backup file.")).toBeVisible();
  await importSheet.getByLabel("Choose backup file").setInputFiles(before.path);
  // The demo data is built relative to today, so the counts come from the exported file.
  const exported = before.json as { periods: unknown[]; dailyLogs: unknown[]; workouts: unknown[]; supplies: unknown[]; reminders: unknown[] };
  await expect(importSheet).toContainText(
    `This backup has ${exported.periods.length} periods, ${exported.dailyLogs.length} check-ins, ${exported.workouts.length} workouts, ${exported.supplies.length} supplies and ${exported.reminders.length} reminders.`,
  );
  await expect(importSheet.getByText("This replaces everything on this device.")).toBeVisible();
  await importSheet.getByRole("button", { name: "Replace my data" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Data imported" })).toBeVisible();

  const after = await exportBackup(page, "after.json", (name) => testInfo.outputPath(name));
  expect(after.json).toEqual(before.json);
});

test("PIN lock stores only a salted hash and locks on open", async ({ page }) => {
  await completeOnboarding(page);
  await openMe(page);
  await page.getByRole("button", { name: /^App lock/ }).click();
  const sheet = page.getByRole("dialog", { name: "App lock" });
  await expect(sheet.getByText("The PIN hides the app from others. It does not encrypt your data.")).toBeVisible();
  await sheet.getByLabel("New PIN").fill("1234");
  await sheet.getByLabel("Repeat the PIN").fill("4321");
  await sheet.getByRole("button", { name: "Turn on app lock" }).click();
  await expect(sheet.getByText("The two PINs do not match.")).toBeVisible();
  await sheet.getByLabel("Repeat the PIN").fill("1234");
  await sheet.getByRole("button", { name: "Turn on app lock" }).click();
  // Turning the lock on does not lock the current visit.
  await expect(page.getByRole("button", { name: /^App lock On/ })).toBeVisible();

  const settings = await readSettings(page);
  // The lock adds exactly two settings. Others, such as the reminder check time, hold no PIN.
  expect(settings.map((setting) => setting.key).filter((key) => key.startsWith("app-lock")).sort()).toEqual([
    "app-lock-hash",
    "app-lock-salt",
  ]);
  expect(settings.find((setting) => setting.key === "app-lock-hash")?.value).toMatch(/^[0-9a-f]{64}$/);
  expect(settings.find((setting) => setting.key === "app-lock-salt")?.value).toMatch(/^[0-9a-f]{32}$/);
  expect(JSON.stringify(settings)).not.toContain("1234");

  await page.reload();
  const lock = page.getByRole("dialog", { name: "Enter your PIN" });
  await expect(lock).toBeVisible();
  await lock.getByLabel("PIN").fill("9999");
  await expect(lock.getByText("That PIN did not match. Try again.")).toBeVisible();
  await lock.getByLabel("PIN").fill("1234");
  await expect(lock).toBeHidden();
  await expect(page.getByRole("button", { name: "About Iszacycle" })).toBeVisible();
});

test("locks again after 5 minutes in the background, not before", async ({ page }) => {
  await page.clock.install();
  await completeOnboarding(page);
  await openMe(page);
  await page.getByRole("button", { name: /^App lock/ }).click();
  await page.getByLabel("New PIN").fill("2580");
  await page.getByLabel("Repeat the PIN").fill("2580");
  await page.getByRole("button", { name: "Turn on app lock" }).click();
  await expect(page.getByRole("button", { name: /^App lock On/ })).toBeVisible();

  const setHidden = (hidden: boolean) =>
    page.evaluate((value) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);

  await setHidden(true);
  await page.clock.fastForward("04:00");
  await setHidden(false);
  await expect(page.getByRole("dialog", { name: "Enter your PIN" })).toHaveCount(0);

  await setHidden(true);
  await page.clock.fastForward("05:01");
  await setHidden(false);
  await expect(page.getByRole("dialog", { name: "Enter your PIN" })).toBeVisible();
});

test("Forgot PIN only offers deleting all data", async ({ page }) => {
  await completeOnboarding(page);
  await openMe(page);
  await page.getByRole("button", { name: /^App lock/ }).click();
  await page.getByLabel("New PIN").fill("1111");
  await page.getByLabel("Repeat the PIN").fill("1111");
  await page.getByRole("button", { name: "Turn on app lock" }).click();
  await expect(page.getByRole("button", { name: /^App lock On/ })).toBeVisible();

  await page.reload();
  const lock = page.getByRole("dialog", { name: "Enter your PIN" });
  await lock.getByRole("button", { name: "Forgot PIN" }).click();
  const forgot = page.getByRole("dialog", { name: "Forgot your PIN?" });
  await expect(forgot.getByText("The only way back in is to delete all data on this device.")).toBeVisible();
  await expect(forgot.getByRole("button")).toHaveText(["Delete all data", "Back to PIN"]);
  await forgot.getByLabel("Type DELETE to confirm").fill("DELETE");
  await forgot.getByRole("button", { name: "Delete all data" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Because “why am I like this today” deserves an answer." })).toBeVisible();
  expect(await readSettings(page)).toEqual([]);
});

test("a low supply shows on Today when a period is near", async ({ page }) => {
  await completeOnboarding(page);
  // A 28-day cycle that started 25 days ago: the next period is predicted in 3 days.
  await putRecords(page, "periods", [{ id: 1, startDate: day(-25), endDate: day(-21) }]);
  await openMe(page);
  await page.getByRole("button", { name: /^Supplies/ }).click();
  await page.getByRole("button", { name: "Add supply" }).click();
  await page.getByRole("button", { name: "How many you have: one less" }).click();
  for (let step = 0; step < 7; step++) await page.getByRole("button", { name: "How many you have: one less" }).click();
  await expect(page.getByRole("group", { name: "How many you have" })).toContainText("2");
  await page.getByRole("button", { name: "Save supply" }).click();
  await expect(page.getByRole("list", { name: "Your supplies" })).toContainText("Low. Low at 4");
  await page.getByRole("button", { name: "Pads: one more" }).click();
  await expect(page.getByLabel("Pads count")).toHaveText("3");

  await page.goto("/today");
  const chip = page.getByRole("button", { name: "Running low on Pads" });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.getByRole("dialog", { name: "Supplies" })).toBeVisible();
});

test("reminders: add, discreet text preview, toggle and delete", async ({ page }) => {
  await completeOnboarding(page);
  await openMe(page);
  await page.getByRole("button", { name: /^Reminders/ }).click();
  const sheet = page.getByRole("dialog", { name: "Reminders" });
  await sheet.getByRole("button", { name: "Add reminder" }).click();
  await sheet.getByRole("button", { name: "Period prep" }).click();
  await expect(sheet.getByText("Shows as: “Your period may start soon. Pack what you need.”")).toBeVisible();
  await sheet.getByLabel("Time").fill("08:30");
  for (const weekend of ["Saturday", "Sunday"]) await sheet.getByRole("button", { name: weekend }).click();
  await sheet.getByRole("button", { name: "Save reminder" }).click();
  await expect(sheet.getByRole("switch", { name: "Period prep" })).toBeChecked();
  await expect(sheet.getByText("08:30, Weekdays")).toBeVisible();
  await sheet.getByRole("switch", { name: "Period prep" }).click();
  await expect(sheet.getByRole("switch", { name: "Period prep" })).not.toBeChecked();
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: /^Reminders 0 on/ })).toBeVisible();

  await page.getByRole("switch", { name: "Discreet mode" }).click();
  await page.getByRole("button", { name: /^Reminders/ }).click();
  await sheet.getByRole("button", { name: "Edit Period prep" }).click();
  await expect(sheet.getByText("Shows as: “Time to check your plans” (discreet mode)")).toBeVisible();
  await sheet.getByRole("button", { name: "Delete reminder" }).click();
  await expect(sheet).toContainText('This deletes the reminder "Period prep" at 08:30.');
  await sheet.getByRole("button", { name: "Delete reminder" }).click();
  await expect(sheet.getByRole("heading", { name: "No reminders yet" })).toBeVisible();
});

test("profile, appearance and about", async ({ page }) => {
  await completeOnboarding(page);
  await openMe(page);
  await page.getByRole("button", { name: /^Profile/ }).click();
  const profile = page.getByRole("dialog", { name: "Profile" });
  await profile.getByLabel("Name (optional)").fill("Mia");
  await profile.getByText("Copper IUD").click();
  await profile.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Profile Mia/ })).toBeVisible();

  await page.getByRole("button", { name: /^Appearance/ }).click();
  await page.getByRole("tab", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("tab", { name: "System" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "About Iszacycle" }).click();
  const about = page.getByRole("dialog", { name: "About Iszacycle" });
  await expect(about.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible();
  await expect(about.getByText("Iszacycle is not a medical device or a contraceptive.")).toBeVisible();
  await expect(about.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  await expect(about.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");

  await page.goto("/today");
  await expect(page.getByText(/^Good (morning|afternoon|evening), Mia$/)).toBeVisible();
});
