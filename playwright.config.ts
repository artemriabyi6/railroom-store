import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
/** Use an installed browser channel (e.g. "msedge", "chrome") or Playwright's bundled Chromium when unset. */
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel, viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Test-only values: a throwaway data dir and an admin password for the admin e2e test.
    env: { DATA_DIR: ".data/e2e", ADMIN_PASSWORD: "e2e-admin-password", PAYMENT_PROVIDER: "demo" },
    timeout: 120_000,
  },
});
