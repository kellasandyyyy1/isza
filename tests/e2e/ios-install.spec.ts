import { expect, test } from "@playwright/test";
import { completeOnboarding } from "./helpers";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test.describe("on an iPhone, outside the Home Screen app", () => {
  test.use({ userAgent: IPHONE_UA, viewport: { width: 375, height: 667 } });

  test("Reminders and About show how to add Iszacycle to the Home Screen", async ({ page }) => {
    await completeOnboarding(page);
    await page.goto("/me");
    await page.getByRole("button", { name: /^Reminders/ }).click();
    const reminders = page.getByRole("dialog", { name: "Reminders" });
    await expect(reminders.getByText("Add Iszacycle to your Home Screen to get notifications.")).toBeVisible();
    const steps = reminders.getByRole("listitem");
    // Each item starts with its visual step number, which screen readers skip (the list is numbered already).
    await expect(steps).toHaveText([
      /^1Open this page in Safari.$/,
      /^2Tap Share at the bottom of the screen. On iPad it is at the top.$/,
      /^3Scroll down and tap Add to Home Screen.$/,
      /^4Tap Add, then open Iszacycle from your Home Screen.$/,
    ]);
    // The switch only works from the Home Screen app, so it is not offered here.
    await expect(reminders.getByRole("switch", { name: "Notifications on this device" })).toHaveCount(0);
    // Each button name stays on one line with its icon.
    for (const name of ["Share", "Add to Home Screen"]) {
      const lines = await reminders.getByText(name, { exact: true }).evaluate((element) => element.getClientRects().length);
      expect(lines, name).toBe(1);
    }
    await reminders.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "About Iszacycle" }).click();
    await expect(page.getByRole("dialog", { name: "About Iszacycle" }).getByText("Add Iszacycle to your Home Screen", { exact: true })).toBeVisible();
  });
});

test.describe("on an iPhone, opened from the Home Screen", () => {
  test.use({ userAgent: IPHONE_UA, viewport: { width: 375, height: 667 } });

  test("the steps are gone and the notifications switch shows instead", async ({ page }) => {
    // iOS sets navigator.standalone when the app runs from its Home Screen icon.
    await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
    await completeOnboarding(page);
    await page.goto("/me");
    await page.getByRole("button", { name: /^Reminders/ }).click();
    const reminders = page.getByRole("dialog", { name: "Reminders" });
    await expect(reminders.getByRole("switch", { name: "Notifications on this device" })).toBeVisible();
    await expect(page.getByText("Open this page in Safari.")).toHaveCount(0);
    await reminders.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: "About Iszacycle" }).click();
    await expect(page.getByText("Add Iszacycle to your Home Screen", { exact: true })).toHaveCount(0);
  });
});

test("other browsers do not see the iPhone steps", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/me");
  await page.getByRole("button", { name: "About Iszacycle" }).click();
  await expect(page.getByText("Open this page in Safari.")).toHaveCount(0);
});
