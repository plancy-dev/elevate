import { expect, test } from "@playwright/test";
import {
  hasE2ELoginCredentials,
} from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";

test.describe("dashboard library", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );

  test("shows Library heading after login", async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto("/dashboard/library");
    await expect(page).toHaveURL(/\/dashboard\/library/);
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveText(/^\s*$/);
  });
});
