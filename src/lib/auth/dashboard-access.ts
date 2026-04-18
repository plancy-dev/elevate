import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type ProfileGateRow = {
  dashboard_access?: boolean | null;
  role?: string | null;
};

function isLikelyMissingDashboardAccessColumn(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("dashboard_access") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    (m.includes("column") && m.includes("profiles"))
  );
}

async function fetchProfileGateRow(
  admin: AdminClient,
  userId: string,
): Promise<{ data: ProfileGateRow | null; error: Error | null }> {
  const first = await admin
    .from("profiles")
    .select("dashboard_access, role")
    .eq("id", userId)
    .maybeSingle();

  if (!first.error) {
    return { data: first.data as ProfileGateRow | null, error: null };
  }

  const msg = first.error.message ?? "";
  if (!isLikelyMissingDashboardAccessColumn(msg)) {
    return { data: null, error: new Error(msg) };
  }

  const second = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (second.error) {
    return { data: null, error: new Error(second.error.message ?? "role-only fetch failed") };
  }
  return { data: second.data as ProfileGateRow | null, error: null };
}

function rowAllowsDashboard(row: ProfileGateRow): boolean {
  if (row.dashboard_access === true) return true;
  if (row.role === "admin") return true;
  return false;
}

async function dashboardGateForProfile(
  admin: AdminClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await fetchProfileGateRow(admin, userId);
  if (error) throw error;
  if (!data) return false;
  return rowAllowsDashboard(data);
}

/**
 * Server-only gate for `/dashboard` (and `/access-pending` bounce).
 *
 * Allowed when **`profiles.dashboard_access`** is true **or** **`profiles.role` is `admin`**
 * (service-role read). If migration `037` is missing, falls back to a **`role`-only** select
 * so `admin` still works.
 *
 * Missing **`SUPABASE_SERVICE_ROLE_KEY`**, missing `userId`, missing profile row, or DB
 * errors → **denied** (fail closed). Check Vercel logs for `[elevate-auth] canUseDashboard`.
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      "[elevate-auth] canUseDashboard failed (deny dashboard):",
      msg.slice(0, 400),
    );
    return false;
  }
}
