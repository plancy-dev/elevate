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
const TRANSIENT_PROFILE_ERROR =
  /schema cache|could not query|connection|timeout|econn/i;
const SCHEMA_CACHE_USER_MESSAGE = /schema cache|could not query/i;

function isTransientProfileError(message: string): boolean {
  return TRANSIENT_PROFILE_ERROR.test(message);
}

function formatProfileError(message: string): string {
  if (SCHEMA_CACHE_USER_MESSAGE.test(message)) {
    return (
      `${message} — Try refreshing the page in a few seconds. If it persists, open Supabase Dashboard → Project Settings → API and reload, or check Auth/DB status.`
    );
  }
  return message;
}

export async function ensureDefaultOrganization(): Promise<EnsureOrgResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  let profile: { organization_id: string | null } | null = null;
  let profileErr = null as { message: string } | null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    profileErr = res.error;
    profile = res.data;
    if (!profileErr) break;
    if (!isTransientProfileError(profileErr.message) || attempt === 2) {
      return { ok: false, error: formatProfileError(profileErr.message) };
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }

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
