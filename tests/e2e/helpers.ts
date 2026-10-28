import { expect, type Page } from "@playwright/test";

interface OnboardingOptions {
  // The label of the contraception card to pick.
  contraception?: string;
  // Pick today as the last period start instead of skipping the date.
  periodStartsToday?: boolean;
}

// Short path through onboarding. By default skips the date and leaves optional answers empty.
export async function completeOnboarding(page: Page, options: OnboardingOptions = {}) {
  const next = page.getByRole("button", { name: "Next", exact: true });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Train smarter" }).click();
  await next.click();
  if (options.periodStartsToday) {
    await page.locator('button[aria-current="date"]').click();
    await next.click();
  } else {
    await page.getByRole("button", { name: "I don't remember" }).click();
  }
  await next.click();
  await next.click();
  await page.getByText(options.contraception ?? "None", { exact: true }).click();
  await next.click();
  await page.getByText("Moderate", { exact: true }).click();
  await next.click();
  await next.click();
  await page.getByLabel("I understand").check();
  await page.getByRole("button", { name: "Start using Iszacycle" }).click();
  await expect(page).toHaveURL(/\/today$/);
}

// Replaces all data with the demo data from src/dev/seed.ts, written straight into IndexedDB. /dev/ui and its
// "Load demo data" button do not exist in production builds, and the e2e tests run against one, so the seed stays
// in the test code and never ships.
export async function loadDemoData(page: Page) {
  const { generateDemoData } = await import("../../src/dev/seed");
  // The app creates the database on its first load; a new device lands on onboarding.
  await page.goto("/");
  await expect(page).toHaveURL(/\/(onboarding|today)$/);
  // Dated from the page's clock, which a test may have set, as the in-app button did.
  const now = new Date(await page.evaluate(() => Date.now()));
  const { version: _version, profile, ...tables } = generateDemoData(now);
  void _version;
  await page.evaluate(
    ({ profile, tables }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const database = request.result;
          const tx = database.transaction(Array.from(database.objectStoreNames), "readwrite");
          for (const name of Array.from(database.objectStoreNames)) tx.objectStore(name).clear();
          if (profile) tx.objectStore("profile").put(profile);
          for (const [name, rows] of Object.entries(tables)) for (const row of rows) tx.objectStore(name).put(row);
          tx.oncomplete = () => {
            database.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      }),
    { profile, tables },
  );
}

// Writes records straight into an IndexedDB store, for states the UI cannot create yet.
// The app must have opened the database first.
export async function putRecords(page: Page, store: string, records: object[]) {
  await page.evaluate(
    ({ store, records }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("isza");
        request.onsuccess = () => {
          const tx = request.result.transaction(store, "readwrite");
          for (const record of records) tx.objectStore(store).put(record);
          tx.oncomplete = () => {
            request.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    { store, records },
  );
}

// The page and the page's scroll area both fit the viewport.
export async function expectNoVerticalScroll(page: Page) {
  const sizes = await page.evaluate(() => {
    const area = document.querySelector("[data-page-scroll]");
    return {
      page: (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
      area: area ? area.scrollHeight - area.clientHeight : 0,
    };
  });
  expect(sizes.page, "document scrolls").toBeLessThanOrEqual(0);
  expect(sizes.area, "page content scrolls").toBeLessThanOrEqual(0);
}
