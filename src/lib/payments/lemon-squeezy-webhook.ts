import type { SupabaseClient } from "@supabase/supabase-js";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { isCatalogCheckoutAllowlistRequired } from "@/lib/env/catalog-checkout";
import { assertCatalogCheckoutAllowlistForUserIdAdminOnly } from "@/lib/payments/assert-catalog-checkout-allowlist";
import { grantOrganizationContentEntitlement } from "@/lib/payments/content-entitlement";
import {
  isEmailOnCatalogPurchaseAllowlist,
  normalizePurchaseAllowlistEmail,
} from "@/lib/payments/purchase-allowlist";
import type { Database } from "@/types/database.types";

type AdminClient = SupabaseClient<Database>;

/** Lemon `attributes.identifier` is a UUID string. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function readCustomDataString(
  customData: Record<string, unknown> | undefined | null,
  key: string,
): string | null {
  if (!customData) {
    return null;
  }
  const v = customData[key];
  if (v == null) {
    return null;
  }
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return null;
}

function parseVariantSlugMap(): Record<string, string> {
  const raw = process.env.LEMON_SQUEEZY_VARIANT_TO_CONTENT_SLUG;
  if (!raw?.trim()) {
    return {};
  }
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) {
        out[k] = v.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

async function resolveActorIdForOrg(
  admin: AdminClient,
  organizationId: string,
  userEmail: string,
): Promise<string | null> {
  const normalized = userEmail.trim().toLowerCase();
  if (normalized) {
    const { data: match } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", normalized)
      .maybeSingle();
    if (match?.id) {
      return match.id;
    }
  }
  const { data: adminRow } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  if (adminRow?.id) {
    return adminRow.id;
  }
  const { data: anyRow } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle();
  return anyRow?.id ?? null;
}

function devWarn(message: string, extra?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[lemonsqueezy] ${message}`, extra ?? "");
  }
}

async function assertCheckoutAllowlistForWebhook(
  admin: AdminClient,
  actorId: string | null,
  userEmail: string,
): Promise<boolean> {
  if (!isCatalogCheckoutAllowlistRequired()) {
    return true;
  }
  if (actorId) {
    return assertCatalogCheckoutAllowlistForUserIdAdminOnly(admin, actorId);
  }
  const normalized = userEmail.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return isEmailOnCatalogPurchaseAllowlist(
    admin,
    normalizePurchaseAllowlistEmail(normalized),
  );
}

export type LemonWebhookResult =
  | { kind: "noop" }
  | { kind: "skipped"; reason: string }
  | { kind: "processed" };

/**
 * Handles a verified Lemon Squeezy order payload (JSON:API) for paid one-time orders.
 * Idempotent by `attributes.identifier` + `lemon_squeezy_processed_orders`.
 */
export async function processLemonSqueezyOrderWebhook(
  admin: AdminClient,
  body: unknown,
  eventName: string,
): Promise<LemonWebhookResult> {
  if (eventName !== "order_created") {
    return { kind: "noop" };
  }

  const root = asRecord(body);
  const meta = asRecord(root?.meta);
  const data = asRecord(root?.data);
  const attributes = asRecord(data?.attributes);

  const status = typeof attributes?.status === "string" ? attributes.status : null;
  const refunded = attributes?.refunded === true;
  if (status !== "paid" || refunded) {
    return { kind: "noop" };
  }

  const lsOrderIdentifier =
    typeof attributes?.identifier === "string" ? attributes.identifier.trim() : "";
  if (!lsOrderIdentifier || !isUuid(lsOrderIdentifier)) {
    return { kind: "skipped", reason: "missing_or_invalid_order_identifier" };
  }

  const { data: existing } = await admin
    .from("lemon_squeezy_processed_orders")
    .select("ls_order_identifier")
    .eq("ls_order_identifier", lsOrderIdentifier)
    .maybeSingle();

  if (existing) {
    return { kind: "noop" };
  }

  const userEmailRaw = typeof attributes?.user_email === "string" ? attributes.user_email : "";
  const userEmail = userEmailRaw.trim().toLowerCase();

  const firstItem = asRecord(attributes?.first_order_item as unknown);
  const variantId =
    typeof firstItem?.variant_id === "number"
      ? firstItem.variant_id
      : typeof firstItem?.variant_id === "string"
        ? Number(firstItem.variant_id)
        : null;

  const customData = asRecord(meta?.custom_data);

  const orgIdFromCheckout = readCustomDataString(customData, "organization_id");
  const slugFromCheckout = readCustomDataString(customData, "content_product_slug");
  const productIdFromCheckout = readCustomDataString(customData, "content_product_id");

  const variantMap = parseVariantSlugMap();
  const slugFromVariant =
    variantId != null && Number.isFinite(variantId)
      ? variantMap[String(variantId)] ?? null
      : null;

  let contentProductId: string | null = null;

  if (productIdFromCheckout && isUuid(productIdFromCheckout)) {
    const { data: byId } = await admin
      .from("content_products")
      .select("id")
      .eq("id", productIdFromCheckout)
      .eq("is_active", true)
      .maybeSingle();
    contentProductId = byId?.id ?? null;
  }

  if (!contentProductId) {
    const slug = slugFromCheckout ?? slugFromVariant;
    if (slug) {
      const { data: bySlug } = await admin
        .from("content_products")
        .select("id")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      contentProductId = bySlug?.id ?? null;
    }
  }

  if (!contentProductId) {
    devWarn("skipped: unknown content product", {
      variant_id: variantId,
      slugFromCheckout,
      slugFromVariant,
    });
    return { kind: "skipped", reason: "unknown_content_product" };
  }

  let organizationId: string | null = null;
  let actorId: string | null = null;

  if (orgIdFromCheckout && isUuid(orgIdFromCheckout)) {
    const { data: orgRow } = await admin
      .from("organizations")
      .select("id")
      .eq("id", orgIdFromCheckout)
      .maybeSingle();
    if (orgRow?.id) {
      organizationId = orgRow.id;
    }
  }

  if (!organizationId && userEmail) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, organization_id")
      .eq("email", userEmail)
      .not("organization_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (profile?.organization_id && profile.id) {
      organizationId = profile.organization_id;
      actorId = profile.id;
    }
  }

  if (organizationId && !actorId) {
    actorId = await resolveActorIdForOrg(admin, organizationId, userEmail);
  }

  if (!organizationId) {
    devWarn("skipped: unknown organization", { userEmail: userEmail || undefined });
    return { kind: "skipped", reason: "unknown_organization" };
  }

  const allowlisted = await assertCheckoutAllowlistForWebhook(admin, actorId, userEmail);
  if (!allowlisted) {
    await logAudit({
      organizationId,
      actorId,
      action: AuditAction.PAYMENT_WEBHOOK,
      entityType: AuditEntityType.LEMON_ORDER,
      entityId: lsOrderIdentifier,
      metadata: {
        source: "lemonsqueezy",
        skipped: "checkout_allowlist",
      },
    });
    return { kind: "skipped", reason: "checkout_allowlist" };
  }

  const grant = await grantOrganizationContentEntitlement(
    admin,
    organizationId,
    contentProductId,
  );

  if (!grant.ok) {
    await logAudit({
      organizationId,
      actorId,
      action: AuditAction.PAYMENT_WEBHOOK,
      entityType: AuditEntityType.LEMON_ORDER,
      entityId: lsOrderIdentifier,
      metadata: {
        source: "lemonsqueezy",
        skipped: "grant_failed",
        error: grant.error,
      },
    });
    return { kind: "skipped", reason: "grant_failed" };
  }

  const { error: ledgerError } = await admin.from("lemon_squeezy_processed_orders").insert({
    ls_order_identifier: lsOrderIdentifier,
    organization_id: organizationId,
    content_product_id: contentProductId,
    user_email: userEmail || null,
    variant_id: variantId ?? null,
    event_name: "order_created",
  });

  if (ledgerError?.code === "23505") {
    return { kind: "noop" };
  }
  if (ledgerError) {
    await logAudit({
      organizationId,
      actorId,
      action: AuditAction.PAYMENT_WEBHOOK,
      entityType: AuditEntityType.LEMON_ORDER,
      entityId: lsOrderIdentifier,
      metadata: {
        source: "lemonsqueezy",
        skipped: "ledger_insert_failed",
        error: ledgerError.message,
      },
    });
    return { kind: "skipped", reason: "ledger_insert_failed" };
  }

  await logAudit({
    organizationId,
    actorId,
    action: AuditAction.PAYMENT_WEBHOOK,
    entityType: AuditEntityType.LEMON_ORDER,
    entityId: lsOrderIdentifier,
    metadata: {
      source: "lemonsqueezy",
      content_product_id: contentProductId,
      status,
    },
  });

  await logAudit({
    organizationId,
    actorId,
    action: AuditAction.CONTENT_ENTITLEMENT_GRANT,
    entityType: AuditEntityType.CONTENT_PRODUCT,
    entityId: contentProductId,
    metadata: {
      source: "lemonsqueezy",
      ls_order_identifier: lsOrderIdentifier,
    },
  });

  return { kind: "processed" };
}
