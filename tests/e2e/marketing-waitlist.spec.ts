import { expect, test } from "@playwright/test";

test.describe("marketing home: waitlist band", () => {
  test("band Contact sales link points at contact route", async ({ page }) => {
    await page.goto("/en");
    const band = page.locator("section.bg-primary");
    const contact = band.getByRole("link", { name: /Contact sales/i });
    await expect(contact).toBeVisible();
    await expect(contact).toHaveAttribute("href", "/contact");
  });

  test("band waitlist submit shows success when API returns ok", async ({
    page,
  }) => {
    await page.route("**/api/waitlist", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/en");
    await page.locator("#waitlist-email-band").fill("e2e-waitlist@example.com");
    await page.getByRole("button", { name: /Join waitlist/i }).last().click();

    await expect(page.getByRole("status")).toContainText(
      /on the list|early access/i,
      { timeout: 15_000 },
    );
  });
});
