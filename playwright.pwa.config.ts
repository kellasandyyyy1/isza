import { defineConfig, devices } from "@playwright/test";

// The service worker only exists in production builds, so these tests build and start the app.
// Run with `npm run e2e:pwa`.
const PORT = 3200;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "pwa.spec.ts",
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
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
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 600_000,
    reuseExistingServer: false,
  },
});
