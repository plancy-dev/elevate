import { expect, test, type Page } from "@playwright/test";
import {
  getE2EUserEmail,
  getE2EUserPassword,
  hasE2ELoginCredentials,
} from "./helpers/credentials";

async function throwIfStillOnLogin(
  page: Page,
  reason: string,
): Promise<never> {
  const banner = page.locator("p.text-danger").first();
  const bannerText = (await banner.isVisible())
    ? (await banner.innerText()).trim().slice(0, 500)
    : "(no error banner)";
  throw new Error(
    `${reason} — url=${page.url()} — banner=${JSON.stringify(bannerText)}`,
  );
}

test.describe("password login → dashboard", () => {
  test.skip(
    !hasE2ELoginCredentials(),
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see docs/TESTING.md)",
  );

  test("reaches dashboard and shows sidebar for the test user", async ({
    page,
  }) => {
    const email = getE2EUserEmail()!;
    const password = getE2EUserPassword()!;

    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: /Log in to Elevate/i }),
    ).toBeVisible();

    // Stable selectors + Enter to submit (avoids flaky React controlled-input submit)
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#password").press("Enter");

    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 35_000 });
    } catch {
      await throwIfStillOnLogin(
        page,
        "Timed out waiting for /dashboard after sign-in",
      );
    }

    await expect(
      page.getByRole("link", { name: /^Overview$/i }).first(),
    ).toBeVisible();
    await expect(page.getByTitle(email)).toBeVisible();
  });
});
