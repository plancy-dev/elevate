import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// So E2E_USER_* and PLAYWRIGHT_BASE_URL work without exporting from the shell
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

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
    // Use `localhost` (not 127.0.0.1) so auth cookies match `pnpm dev` / NEXT_PUBLIC_APP_URL
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
