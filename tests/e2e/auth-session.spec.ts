import { expect, test } from "@playwright/test";
import {
  getE2EUserEmail,
  getE2EUserPassword,
  hasE2ELoginCredentials,
} from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";

test.describe("session: sign out and sign back in", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );

  test("sign out lands on login; password sign-in works again", async ({
    page,
  }) => {
    const email = getE2EUserEmail()!;
    const password = getE2EUserPassword()!;

    await loginAsTestUser(page);
    await expect(page.getByTitle(email)).toBeVisible();

    await page.getByRole("button", { name: /^Sign out$/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: /Log in to Elevate/i }),
    ).toBeVisible();

    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#password").press("Enter");

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 35_000 });
    await expect(page.getByTitle(email)).toBeVisible();
  });
});
