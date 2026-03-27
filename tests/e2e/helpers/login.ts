import { expect, type Page } from "@playwright/test";
import { getE2EUserEmail, getE2EUserPassword } from "./credentials";

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

/** Password sign-in as the E2E user; ends on `/dashboard`. */
export async function loginAsTestUser(page: Page): Promise<void> {
  const email = getE2EUserEmail()!;
  const password = getE2EUserPassword()!;

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: /Log in to Elevate/i }),
  ).toBeVisible();

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
}
