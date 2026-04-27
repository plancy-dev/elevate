import { expect, type Locator, type Page } from "@playwright/test";

export function signOutButton(page: Page): Locator {
  return page.getByRole("button", { name: /^(Sign out|로그아웃)$/i });
}

export async function expectLoginFormReady(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /Log in to Elevate/i })).toBeVisible();
  await expect(page.getByLabel(/Work email/i)).toBeVisible();
  await expect(page.getByLabel(/^Password$/i)).toBeVisible();
}

export async function expectSignedInSession(
  page: Page,
  email: string,
): Promise<void> {
  await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible();
  await expect(page.locator(`text=${email}`)).toBeVisible();
}

