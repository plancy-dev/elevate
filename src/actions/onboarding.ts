"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnsureOrgResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

/**
 * First-time users have no organization_id; create a default org and attach profile (admin).
 * Uses service role for the update when RLS would block org creation.
 */
export async function ensureDefaultOrganization(): Promise<EnsureOrgResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) return { ok: false, error: profileErr.message };
  if (profile?.organization_id) {
    return { ok: true, organizationId: profile.organization_id };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local for onboarding.",
    };
  }

  const slug = `org-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: "My organization", slug })
    .select("id")
    .single();

  if (orgErr || !org) {
    return { ok: false, error: orgErr?.message ?? "Failed to create organization" };
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update({ organization_id: org.id, role: "admin" })
    .eq("id", user.id);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  return { ok: true, organizationId: org.id };
}
