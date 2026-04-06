"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

async function assertPlatformAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "unauthorized" };

  if (!canAccessElevateServiceAdmin(user.email)) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true };
}

export type WaitlistSignupRow = {
  id: string;
  email: string;
  locale: string | null;
  source: string;
  created_at: string;
};

export async function listWaitlistSignups(): Promise<
  { ok: true; rows: WaitlistSignupRow[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("waitlist_signups")
      .select("id, email, locale, source, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: (data ?? []) as WaitlistSignupRow[] };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function getWaitlistEmailSettings(): Promise<
  | { ok: true; waitlistBccEmail: string | null }
  | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_email_settings")
      .select("waitlist_bcc_email")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    const v = data?.waitlist_bcc_email?.trim();
    return { ok: true, waitlistBccEmail: v || null };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function updateWaitlistBccEmail(raw: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const trimmed = raw.trim();
  if (trimmed === "") {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("platform_email_settings")
        .update({
          waitlist_bcc_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) return { ok: false, error: error.message };
      revalidatePath("/admin/waitlist");
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "unknown",
      };
    }
  }

  if (trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
    return { ok: false, error: "invalid_email" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("platform_email_settings")
      .update({
        waitlist_bcc_email: trimmed.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/waitlist");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}
