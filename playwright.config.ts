import { defineConfig, devices } from "@playwright/test";

/**
 * Local: `pnpm dev` in another terminal, then `pnpm test:e2e`.
 * Staging: `PLAYWRIGHT_BASE_URL=https://your-app.vercel.app pnpm test:e2e`
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
