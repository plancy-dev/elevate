"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";
import { normalizePurchaseAllowlistEmail } from "@/lib/payments/purchase-allowlist";

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

export type PurchaseAllowlistRow = {
  id: string;
  email_normalized: string;
  created_at: string;
  note: string | null;
};

export async function listCatalogPurchaseAllowlist(): Promise<
  { ok: true; rows: PurchaseAllowlistRow[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("catalog_purchase_allowlist")
      .select("id, email_normalized, created_at, note")
      .order("created_at", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: (data ?? []) as PurchaseAllowlistRow[] };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function addCatalogPurchaseAllowlistEntry(params: {
  email: string;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const raw = params.email?.trim();
  if (!raw || !raw.includes("@")) {
    return { ok: false, error: "invalid_email" };
  }
  const email_normalized = normalizePurchaseAllowlistEmail(raw);

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("catalog_purchase_allowlist").insert({
      email_normalized,
      note: params.note?.trim() || null,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "duplicate" };
      }
      return { ok: false, error: error.message };
    }
    revalidatePath("/admin/purchase-allowlist");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function removeCatalogPurchaseAllowlistEntry(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("catalog_purchase_allowlist")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/purchase-allowlist");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}
