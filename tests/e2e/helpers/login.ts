import { expect, type Page } from "@playwright/test";
import { getE2EUserEmail, getE2EUserPassword } from "./credentials";
import { expectLoginFormReady } from "./auth-selectors";

async function throwIfStillOnLogin(
  page: Page,
  reason: string,
): Promise<never> {
  if (page.isClosed()) {
    throw new Error(`${reason} — page closed before login diagnostics`);
  }
  const banner = page.locator("p.text-danger, [role='alert']").first();
  const bannerText = (await banner.isVisible().catch(() => false))
    ? ((await banner.innerText()).trim().slice(0, 500) || "(empty banner)")
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
  await expectLoginFormReady(page);

  // Hydration guard: verify tab interactions before submit so we do not
  // accidentally do a pre-hydration native form submit.
  const magicTab = page.getByRole("tab", { name: /^Magic link$/i });
  const passwordTab = page.getByRole("tab", { name: /^Password$/i });
  const passwordInput = page.locator("#password");
  await magicTab.click();
  await expect(passwordInput).toBeHidden();
  await passwordTab.click();
  await expect(passwordInput).toBeVisible();

  const emailInput = page.getByLabel(/Work email/i);
  const passwordInputByLabel = page.getByLabel(/^Password$/i);
  await emailInput.fill(email);
  await passwordInputByLabel.fill(password);
  await page.getByRole("button", { name: /^(Log In|로그인)$/i }).click();

  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 35_000 });
  } catch {
    await throwIfStillOnLogin(
      page,
      "Timed out waiting for /dashboard after sign-in",
    );
  }
}
