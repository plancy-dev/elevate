import { expect, test } from "@playwright/test";

test.describe("public auth shell", () => {
  test("login page shows heading and email field", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Log in to Elevate/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/Work email/i)).toBeVisible();
  });
});
