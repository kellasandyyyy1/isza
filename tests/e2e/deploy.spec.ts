import { expect, test, type Page } from "@playwright/test";
import { completeOnboarding, loadDemoData } from "./helpers";

// Collects console errors and uncaught exceptions, including Content-Security-Policy violations.
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("Privacy: plain sections, the date, what the push server stores and how to turn it off", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await expect(page.getByText("Last updated: 28 October 2026")).toBeVisible();
  for (const text of [
    "Your data stays on this device. We never sell or share it.",
    "Iszacycle has no analytics, no ads, no trackers and no third-party scripts.",
    "A random device ID, not linked to your name or email.",
    "Your time zone, so reminders arrive at your local time.",
    "Go to Me, then Reminders, and turn off Notifications on this device.",
    "Go to Me, then Export data, and tap Download backup.",
    "Go to Me, then Delete all data, and type DELETE to confirm.",
    "Iszacycle is not a medical device or a contraceptive.",
  ]) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  // The draft note is for development only.
  await expect(page.getByText(/Draft for legal review/)).toHaveCount(0);
  await page.getByRole("link", { name: "Read the terms" }).click();
  await expect(page).toHaveURL(/\/terms$/);
});

test("Terms: not a medical device, the date, and no draft note in production", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1, name: "Terms" })).toBeVisible();
  await expect(page.getByText("Last updated: 28 October 2026")).toBeVisible();
  await expect(page.getByText("Iszacycle is not a medical device or a contraceptive.", { exact: true })).toBeVisible();
  await expect(page.getByText("If something feels wrong with your body, consider talking to a doctor.")).toBeVisible();
  await expect(page.getByText(/Draft for legal review/)).toHaveCount(0);
});

test.describe("legal pages at 360px", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("never scroll sideways", async ({ page }) => {
    for (const path of ["/privacy", "/terms"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test("security headers on every response", async ({ request }) => {
  for (const path of ["/", "/today", "/privacy", "/manifest.webmanifest"]) {
    const response = await request.get(path);
    const headers = response.headers();
    const csp = headers["content-security-policy"] ?? "";
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'");
    expect(csp, path).not.toContain("'unsafe-eval'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).toContain("object-src 'none'");
    // Same origin only: no other host anywhere in the policy.
    expect(csp, path).not.toMatch(/https?:|\*/);
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers["x-content-type-options"], path).toBe("nosniff");
  }
});

test("metadata: title, description, Open Graph image and theme colors", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page).toHaveTitle("Privacy | Iszacycle");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Iszacycle");
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");

  await page.goto("/onboarding");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Your data stays on this device/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("robots.txt allows only the landing routes", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Allow: /$");
  expect(body).toContain("Allow: /privacy");
  expect(body).toContain("Allow: /terms");
  expect(body).toContain("Disallow: /");
});

test("no /dev routes in production", async ({ request }) => {
  expect((await request.get("/dev/ui")).status()).toBe(404);
  // 404 once push is configured; 500 while a VAPID secret is missing, since src/server/web-push.ts fails on load.
  // Either way it never sends anything.
  expect((await request.post("/api/push/dev-test", { data: {} })).status()).toBeGreaterThanOrEqual(400);
});

test("an unknown page shows the empty state with one way back to Today", async ({ page }) => {
  await completeOnboarding(page);
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
  await page.getByRole("button", { name: "Back to Today" }).click();
  await expect(page).toHaveURL(/\/today$/);
});

test("no console errors on any screen", async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemoData(page);
  for (const path of ["/today", "/calendar", "/train", "/insights", "/me", "/support", "/privacy", "/terms"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});
