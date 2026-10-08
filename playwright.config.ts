import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_ENV } from "./tests/e2e/environment";

/**
 * End-to-end tests run against a production build (`next build` + `next start`) backed by its
 * own seeded local database, so they exercise real caching, rendering and HTTP behaviour without
 * touching development data. See docs/TESTING.md.
 */
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  // One worker: the journeys share accounts and per-IP rate limits.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command:
      "npx tsx tests/e2e/prepare-database.ts && npx next build && npx next start --port 3100",
    // A route that does not read catalogue data, so readiness checks cannot warm caches early.
    url: `${E2E_BASE_URL}/robots.txt`,
    env: E2E_ENV,
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 60_000,
    stdout: "pipe",
  },
});
