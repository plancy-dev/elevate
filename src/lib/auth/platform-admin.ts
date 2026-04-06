import { isOrganizationAdmin } from "@/lib/user-roles";

/**
 * Emails allowed to use the **Elevate service admin** shell (`/admin`: catalog, waitlist,
 * checkout allowlist). Configure via `PLATFORM_ADMIN_EMAILS` (comma-separated) or `ADMIN_EMAIL`.
 * When the combined set is **empty**, no one can access `/admin` (set at least one email in dev/prod).
 */
export function getElevateServiceAdminEmails(): Set<string> {
  const fromList = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  const single = process.env.ADMIN_EMAIL?.trim();
  const parts: string[] = [];
  if (fromList) {
    parts.push(...fromList.split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (single) {
    parts.push(single);
  }
  return new Set(parts.map((e) => e.toLowerCase()));
}

/** @deprecated Use {@link getElevateServiceAdminEmails} */
export function getPlatformAdminEmails(): Set<string> {
  return getElevateServiceAdminEmails();
}

/**
 * **Elevate platform / service staff** — `/admin` (catalog, waitlist, purchase allowlist).
 * Independent of organization role; uses the email allowlist only.
 */
export function canAccessElevateServiceAdmin(email: string | undefined): boolean {
  const allow = getElevateServiceAdminEmails();
  if (allow.size === 0) return false;
  const e = email?.trim().toLowerCase();
  return e != null && e.length > 0 && allow.has(e);
}

/**
 * **Organization administrator** (`profiles.role === "admin"`) — org console, audit, billing.
 * Routes under `/dashboard/organization`.
 */
export function canAccessOrganizationAdminConsole(
  orgRole: string | undefined,
): boolean {
  return isOrganizationAdmin(orgRole);
}
