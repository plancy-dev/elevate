import { expect, test } from "@playwright/test";
import {
  getE2EUserEmail,
  hasE2ELoginCredentials,
} from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";

test.describe("dashboard library", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );

  test("shows Library heading after login", async ({ page }) => {
    const email = getE2EUserEmail()!;
    await loginAsTestUser(page);

    await page.goto("/dashboard/library");
    await expect(
      page.getByRole("heading", { name: /^Library$/i }),
    ).toBeVisible();
    await expect(page.getByTitle(email)).toBeVisible();
  });
});
