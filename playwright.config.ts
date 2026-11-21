import { defineConfig, devices } from "@playwright/test";

// E2E uses a mock Paystack and a low free limit. Set E2E_PROD=1 to run against `next start` (needs a build).
const env = {
  ...process.env,
  APP_URL: "http://localhost:3100",
  FREE_DAILY_LIMIT: "3",
  PAYSTACK_API_BASE: "http://localhost:3199",
  PAYSTACK_SECRET_KEY: "sk_test_e2e_secret",
} as Record<string, string>;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3100", ...devices["Pixel 5"], trace: "retain-on-failure" },
  webServer: [
    { command: "node tests/e2e/mock-paystack.mjs", url: "http://localhost:3199/health", reuseExistingServer: false, env },
    { command: process.env.E2E_PROD ? "npx next start -p 3100" : "npx next dev -p 3100", url: "http://localhost:3100", reuseExistingServer: false, timeout: 180_000, env },
  ],
});
