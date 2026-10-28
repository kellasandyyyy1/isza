import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding } from "./helpers";

// Today has no page title: its h1 is the greeting.
const GREETING = /^Good (morning|afternoon|evening)/;

const appRoutes: { path: string; title: string; heading: string | RegExp }[] = [
  { path: "/today", title: "Today", heading: GREETING },
  { path: "/calendar", title: "Calendar", heading: "Calendar" },
  { path: "/train", title: "Train", heading: "Train" },
  { path: "/insights", title: "Insights", heading: "Insights" },
  { path: "/me", title: "Me", heading: "Me" },
];

const allRoutes = [
  { path: "/onboarding", title: "Welcome", heading: "Because “why am I like this today” deserves an answer." },
  ...appRoutes,
];

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

test.describe("routes", () => {
  for (const { path, title, heading } of allRoutes) {
    test(`${path} shows its title`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page).toHaveTitle(`${title} | Iszacycle`);
    });
  }

  test("onboarding has no navigation", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Because “why am I like this today” deserves an answer.");
    await expect(mainNav(page)).toHaveCount(0);
  });
});

test("/ redirects to onboarding first, then to today", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);
  await completeOnboarding(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
});

test("main navigation moves between pages and marks the active one", async ({ page }) => {
  await page.goto("/today");
  for (const { path, title, heading } of appRoutes) {
    await mainNav(page).getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(mainNav(page).getByRole("link", { name: title })).toHaveAttribute("aria-current", "page");
    await expect(mainNav(page).locator('[aria-current="page"]')).toHaveCount(1);
  }
});

test("keyboard Tab reaches every nav item with a visible focus ring", async ({ page }) => {
  await page.goto("/today");
  // Wait until the page is interactive (the app lock check has finished) before tabbing.
  await expect(page.getByText(/^Good (morning|afternoon|evening)/)).toBeVisible();
  const reached = new Set<string>();
  // Today's own buttons come first in the tab order, then the bottom tab bar.
  for (let i = 0; i < 30 && reached.size < appRoutes.length; i++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!(el instanceof HTMLAnchorElement) || !el.closest('nav[aria-label="Main"]')) return null;
      const style = getComputedStyle(el);
      return { href: el.getAttribute("href"), outline: style.outlineStyle, width: style.outlineWidth };
    });
    if (focused?.href) {
      expect(focused.outline).not.toBe("none");
      expect(focused.width).not.toBe("0px");
      reached.add(focused.href);
    }
  }
  expect([...reached].sort()).toEqual(appRoutes.map((route) => route.path).sort());
});

test.describe("small phone 360x640", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  for (const { path } of allRoutes) {
    test(`${path} has no page-level vertical scroll`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
