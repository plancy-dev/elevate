import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { isCatalogCheckoutAllowlistRequired } from "@/lib/env/catalog-checkout";
import {
  isEmailOnCatalogPurchaseAllowlist,
  normalizePurchaseAllowlistEmail,
} from "@/lib/payments/purchase-allowlist";
import { PaymentIntentErrorCode } from "@/lib/payments/payment-intent-errors";

type UserClient = SupabaseClient<Database>;
type AdminClient = SupabaseClient<Database>;

/**
 * When allowlist is required, ensures `profiles.email` is on `catalog_purchase_allowlist`.
 */
export async function assertCatalogCheckoutAllowlistForUserId(
  supabase: UserClient,
  admin: AdminClient,
  userId: string,
): Promise<
  { ok: true } | { ok: false; error: typeof PaymentIntentErrorCode.checkoutAllowlistDenied | typeof PaymentIntentErrorCode.checkoutAllowlistNoEmail }
> {
  if (!isCatalogCheckoutAllowlistRequired()) {
    return { ok: true };
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  const raw = prof?.email?.trim();
  if (!raw) {
    return { ok: false, error: PaymentIntentErrorCode.checkoutAllowlistNoEmail };
  }

  const normalized = normalizePurchaseAllowlistEmail(raw);
  const allowed = await isEmailOnCatalogPurchaseAllowlist(admin, normalized);
  if (!allowed) {
    return { ok: false, error: PaymentIntentErrorCode.checkoutAllowlistDenied };
  }

  return { ok: true };
}

/** Webhook / server-only paths that only have a service-role client and `user_id`. */
export async function assertCatalogCheckoutAllowlistForUserIdAdminOnly(
  admin: AdminClient,
  userId: string,
): Promise<boolean> {
  if (!isCatalogCheckoutAllowlistRequired()) {
    return true;
  }
  const { data: prof } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const raw = prof?.email?.trim();
  if (!raw) return false;
  return isEmailOnCatalogPurchaseAllowlist(
    admin,
    normalizePurchaseAllowlistEmail(raw),
  );
}
