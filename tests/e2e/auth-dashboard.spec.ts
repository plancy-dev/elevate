import { expect, test } from "@playwright/test";
import {
  getE2EUserEmail,
  hasE2ELoginCredentials,
} from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";

test.describe("password login → dashboard", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );

  test("reaches dashboard and shows sidebar for the test user", async ({
    page,
  }) => {
    const email = getE2EUserEmail()!;
    await loginAsTestUser(page);

    await expect(
      page.getByRole("link", { name: /^Overview$/i }).first(),
    ).toBeVisible();
    await expect(page.getByTitle(email)).toBeVisible();
  });
});
