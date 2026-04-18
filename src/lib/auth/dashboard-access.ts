import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

async function profileDashboardAccessGranted(
  admin: AdminClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("profiles")
    .select("dashboard_access")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.dashboard_access === true;
}

/**
 * Server-only. `/dashboard` is allowed only when **`profiles.dashboard_access`** is `true`
 * for the signed-in user (read with the service role — not `profiles.role`, which is org-scoped).
 *
 * - No feature env flags: behavior is always this check.
 * - Missing **`SUPABASE_SERVICE_ROLE_KEY`**, missing `userId`, missing profile row, DB/column errors,
 *   or `dashboard_access === false` → **denied** (fail closed).
 *
 * `email` / `orgRole` are ignored but kept so call sites stay stable.
 */
export async function canUseDashboard(
  _email: string | undefined,
  _orgRole: string | undefined,
  userId?: string,
): Promise<boolean> {
  if (!userId?.trim()) {
    return false;
  }
  try {
    const admin = createAdminClient();
    return await profileDashboardAccessGranted(admin, userId);
  } catch {
    return false;
  }
}
