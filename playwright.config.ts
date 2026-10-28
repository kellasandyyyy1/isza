import { defineConfig, devices } from "@playwright/test";

// The tests run against a production build, the same code that is deployed: /dev routes are 404 there and the
// demo data is written by the test helper. A server already running on this port is reused locally.
const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  // Needs a production build with the service worker: run with `npm run e2e:pwa`.
  testIgnore: "pwa.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 600_000,
    reuseExistingServer: !process.env.CI,
  },
});
