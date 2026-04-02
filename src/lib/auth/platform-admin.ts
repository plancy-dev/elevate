import { isOrganizationAdmin } from "@/lib/user-roles";

/**
 * Emails allowed to use `/admin` when `ADMIN_EMAIL` / `PLATFORM_ADMIN_EMAILS` is set.
 * - `PLATFORM_ADMIN_EMAILS`: comma-separated list (preferred for multiple).
 * - `ADMIN_EMAIL`: single email (same as seed script; merged into the list).
 * When the combined set is non-empty, **only** those emails may access the platform admin shell.
 * When empty (not configured), falls back to **organization admin** (`profiles.role === "admin"`).
 */
export function getPlatformAdminEmails(): Set<string> {
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

export function canAccessPlatformAdmin(
  email: string | undefined,
  orgRole: string | undefined,
): boolean {
  const allow = getPlatformAdminEmails();
  if (allow.size > 0) {
    const e = email?.trim().toLowerCase();
    return e != null && e.length > 0 && allow.has(e);
  }
  return isOrganizationAdmin(orgRole);
}
