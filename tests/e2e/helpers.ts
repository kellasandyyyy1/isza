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
  await page.getByRole("button", { name: "Start using Isza" }).click();
  await expect(page).toHaveURL(/\/today$/);
}

// Replaces all data with the demo data, using the development-only button on /dev/ui.
export async function loadDemoData(page: Page) {
  page.once("dialog", (dialog) => void dialog.accept());
  await page.goto("/dev/ui");
  await page.getByRole("button", { name: "Load demo data" }).click();
  await expect(page.getByText("Demo data loaded")).toBeVisible();
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
