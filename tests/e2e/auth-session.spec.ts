import { expect, test } from "@playwright/test";
import {
  getE2EUserEmail,
  hasE2ELoginCredentials,
} from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";
import {
  expectLoginFormReady,
  expectSignedInSession,
  signOutButton,
} from "./helpers/auth-selectors";

test.describe("session: sign out and sign back in", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );
  test.setTimeout(90_000);

  test("sign out lands on login; password sign-in works again", async ({
    page,
  }) => {
    const email = getE2EUserEmail()!;

    await loginAsTestUser(page);
    await expectSignedInSession(page, email);

    await signOutButton(page).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expectLoginFormReady(page);
    await loginAsTestUser(page);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 35_000 });
    await expectSignedInSession(page, email);
  });
});
