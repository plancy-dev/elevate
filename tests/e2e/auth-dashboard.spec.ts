import { expect, test } from "@playwright/test";
import {
  getE2EUserEmail,
  getE2EUserPassword,
  hasE2ELoginCredentials,
} from "./helpers/credentials";

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

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /Log in to Elevate/i }),
    ).toBeVisible();

    await page.getByLabel(/Work email/i).fill(email);
    await page.getByLabel(/^Password$/i).fill(password);

    const tokenResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/v1/token") &&
        res.request().method() === "POST",
      { timeout: 20_000 },
    );
    await page.getByRole("button", { name: /^Log In$/i }).click();
    const tokenRes = await tokenResponse;
    if (!tokenRes.ok()) {
      const body = (await tokenRes.text().catch(() => "")).slice(0, 400);
      throw new Error(
        `Supabase token request failed: HTTP ${tokenRes.status()} — ${body || "(empty body)"}`,
      );
    }

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 25_000 });
    await expect(
      page.getByRole("link", { name: /^Overview$/i }).first(),
    ).toBeVisible();
    await expect(page.getByTitle(email)).toBeVisible();
  });
});
