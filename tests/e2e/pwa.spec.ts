import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding } from "./helpers";

// Today's h1 is the greeting; the other screens are headed by their names.
const ROUTES: { path: string; heading: string | RegExp }[] = [
  { path: "/today", heading: /^Good (morning|afternoon|evening)/ },
  { path: "/calendar", heading: "Calendar" },
  { path: "/train", heading: "Train" },
  { path: "/insights", heading: "Insights" },
  { path: "/me", heading: "Me" },
  { path: "/onboarding", heading: "Because “why am I like this today” deserves an answer." },
];

// Waits until the service worker is active and controls this page.
async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve()));
    }
  });
}

test("the manifest and icons make the app installable", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "Iszacycle",
    short_name: "Iszacycle",
    display: "standalone",
    start_url: "/today",
    // The page background, like the theme-color meta tag in light mode.
    theme_color: "#FFFAF7",
    background_color: "#FFFAF7",
  });
  for (const icon of manifest.icons as { src: string; sizes: string; purpose: string }[]) {
    const response = await request.get(icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
  expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");

  // The same installability check Lighthouse used: Chrome reports no errors.
  await page.goto("/today");
  await waitForServiceWorker(page);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  expect(installabilityErrors).toEqual([]);
});

test("every screen loads offline after the first visit, and saving still works", async ({ page, context }) => {
  await completeOnboarding(page);
  await waitForServiceWorker(page);

  await context.setOffline(true);
  // Opening each screen directly, as from a bookmark or the home screen.
  for (const { path, heading } of ROUTES) {
    const tab = await context.newPage();
    await tab.goto(path);
    await expect(tab.getByRole("heading", { level: 1 }), path).toHaveText(heading);
    await tab.close();
  }

  // Moving between screens with the tab bar, twice round, tapping as soon as each screen shows.
  await page.goto("/today");
  await expect(page.getByText(/^Good (morning|afternoon|evening)/)).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Calendar", "Train", "Insights", "Me", "Today", "Insights", "Calendar", "Me", "Train", "Today"]) {
    await nav.getByRole("link", { name }).click();
    await expect(page.getByRole("heading", { level: 1 }), name).toHaveText(
      name === "Today" ? /^Good (morning|afternoon|evening)/ : name,
    );
    await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  }

  // Save a check-in with the network off. It goes to IndexedDB, so it survives a reload.
  await page.getByRole("button", { name: "Log today's check-in" }).click();
  const sheet = page.getByRole("dialog", { name: "Today's check-in" });
  await sheet.getByRole("button", { name: "Light" }).click();
  await sheet.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("button", { name: "Edit check-in" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Edit check-in" })).toBeVisible();

  // The saved check-in shows on the calendar too, still offline.
  await nav.getByRole("link", { name: "Calendar" }).click();
  await expect(page.locator("[aria-current='date']")).toHaveAttribute("data-checkin", "true");
  await context.setOffline(false);
});
