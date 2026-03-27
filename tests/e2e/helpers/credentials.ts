/**
 * E2E password login — credentials only via env (never commit).
 * Load `.env.local` from `playwright.config.ts` (dotenv).
 */

export function getE2EUserEmail(): string | undefined {
  return process.env.E2E_USER_EMAIL?.trim() || undefined;
}

export function getE2EUserPassword(): string | undefined {
  return process.env.E2E_USER_PASSWORD?.trim() || undefined;
}

export function hasE2ELoginCredentials(): boolean {
  return Boolean(getE2EUserEmail() && getE2EUserPassword());
}
