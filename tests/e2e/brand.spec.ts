import { expect, test } from "@playwright/test";
import { loadDemoData } from "./helpers";

const wordmark = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Main" }).getByText("iszacycle", { exact: true });

// The sidebar shows from 1024px: the wordmark on one line, inside the 240px sidebar, never cut off.
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`the sidebar wordmark fits on one line at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await loadDemoData(page);
    await page.goto("/today");
    await expect(wordmark(page)).toBeVisible();
    const box = await wordmark(page).evaluate((element) => {
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      const sidebar = element.closest("nav")!.getBoundingClientRect();
      return {
        fontSize: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
        height: text.height,
        textRight: text.right,
        sidebarRight: sidebar.right - parseFloat(style.paddingRight),
        overflow: element.scrollWidth - element.clientWidth,
      };
    });
    console.log(`${viewport.width}px wordmark: ${box.fontSize}px, text ends at ${box.textRight}, room to ${box.sidebarRight}`);
    // The h1 size from the type scale, unchanged.
    expect(box.fontSize).toBe(24);
    expect(box.height).toBeLessThanOrEqual(box.lineHeight + 1);
    expect(box.overflow).toBeLessThanOrEqual(0);
    expect(box.textRight).toBeLessThanOrEqual(box.sidebarRight);
  });
}

// Under 1024px there is no sidebar, and onboarding has no wordmark: nothing to wrap or cut off.
for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`no wordmark to overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/onboarding");
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    await expect(page.getByText("iszacycle", { exact: true })).toHaveCount(0);
    await loadDemoData(page);
    await page.goto("/today");
    await expect(wordmark(page)).toBeHidden();
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sideways).toBeLessThanOrEqual(0);
  });
}

test("data saved under the legacy database name still loads after the rename", async ({ page }) => {
  // loadDemoData writes straight into the IndexedDB database named "isza", as an existing user's data is.
  await loadDemoData(page);
  await page.goto("/today");
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText(/^Day \d+$/)).toBeVisible();
  const databases = await page.evaluate(() => indexedDB.databases().then((list) => list.map((item) => item.name)));
  expect(databases).toContain("isza");
  expect(databases).not.toContain("iszacycle");
});

test("the browser title, install name and About sheet say Iszacycle", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "Iszacycle", short_name: "Iszacycle" });
  await loadDemoData(page);
  await page.goto("/me");
  await expect(page).toHaveTitle("Me | Iszacycle");
  await page.getByRole("button", { name: "About Iszacycle" }).click();
  await expect(page.getByRole("dialog", { name: "About Iszacycle" })).toContainText(
    "Iszacycle is not a medical device or a contraceptive.",
  );
});
