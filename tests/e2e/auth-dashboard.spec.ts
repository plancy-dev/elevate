import { test } from "@playwright/test";
import {
  getE2EUserEmail,
  hasE2ELoginCredentials,
} from "./helpers/credentials";
import { loginAsTestUser } from "./helpers/login";
import { expectSignedInSession } from "./helpers/auth-selectors";

test.describe("password login → dashboard", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );
  test.setTimeout(90_000);

  test("reaches dashboard and shows sidebar for the test user", async ({
    page,
  }) => {
    const email = getE2EUserEmail()!;
    await loginAsTestUser(page);

    await expectSignedInSession(page, email);
  });
});
