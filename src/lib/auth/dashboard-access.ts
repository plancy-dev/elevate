import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";
import { normalizePurchaseAllowlistEmail } from "@/lib/payments/purchase-allowlist";
import { isEmailOnPromptStudioBetaAllowlist } from "@/lib/prompt-studio/studio-beta-allowlist";
import { isOrganizationAdmin } from "@/lib/user-roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * When `DASHBOARD_ACCESS_STRICT=true`, dashboard is limited to:
 * - Elevate service admins (`PLATFORM_ADMIN_EMAILS` / `ADMIN_EMAIL`),
 * - Organization admins (`profiles.role === "admin"`) unless `DASHBOARD_ALLOW_ORG_ADMIN=false`,
 * - Emails present in `waitlist_signups` (same address as auth, normalized), or
 * - Emails in `prompt_studio_beta_allowlist`.
 *
 * When unset/false, all signed-in users keep previous behavior (open access).
 */
export function isDashboardAccessStrictMode(): boolean {
  return process.env.DASHBOARD_ACCESS_STRICT === "true";
}

function allowOrganizationAdminsInStrictMode(): boolean {
  return process.env.DASHBOARD_ALLOW_ORG_ADMIN !== "false";
}

async function isEmailOnMarketingWaitlist(
  admin: AdminClient,
  emailNormalized: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("waitlist_signups")
    .select("id")
    .eq("email", emailNormalized)
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

/**
 * Server-only. Uses service role for allowlist / waitlist tables (no public RLS).
 */
export async function canUseDashboard(
  email: string | undefined,
  orgRole: string | undefined,
): Promise<boolean> {
  if (!isDashboardAccessStrictMode()) {
    return true;
  }
  if (!email?.trim()) {
    return false;
  }
  if (canAccessElevateServiceAdmin(email)) {
    return true;
  }
  if (allowOrganizationAdminsInStrictMode() && isOrganizationAdmin(orgRole)) {
    return true;
  }

  const normalized = normalizePurchaseAllowlistEmail(email);
  const admin = createAdminClient();
  const [onWaitlist, onBetaAllowlist] = await Promise.all([
    isEmailOnMarketingWaitlist(admin, normalized),
    isEmailOnPromptStudioBetaAllowlist(admin, normalized),
  ]);

  return onWaitlist || onBetaAllowlist;
}
