import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

async function dashboardGateForProfile(
  admin: AdminClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("profiles")
    .select("dashboard_access, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;
  if (data.dashboard_access === true) return true;
  /** Platform operators seeded via `scripts/seed-admin.mjs` (`role: admin`). */
  if (data.role === "admin") return true;
  return false;
}

/**
 * Server-only gate for `/dashboard` (and `/access-pending` bounce).
 *
 * Allowed when **`profiles.dashboard_access`** is true **or** **`profiles.role` is `admin`**
 * (single service-role read — not the anon session’s `profiles` row alone).
 *
 * Missing **`SUPABASE_SERVICE_ROLE_KEY`**, missing `userId`, missing profile row, or DB
 * errors → **denied** (fail closed).
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
    return await dashboardGateForProfile(admin, userId);
  } catch {
    return false;
  }
}
