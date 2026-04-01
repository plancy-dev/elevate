"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTossWidgetClientKey } from "@/lib/env/toss";
import { tossConfirmPayment } from "@/lib/payments/toss-api";
import { grantOrganizationContentEntitlement } from "@/lib/payments/content-entitlement";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";
import { revalidatePath } from "next/cache";

function generateOrderId(): string {
  const id = crypto.randomUUID().replace(/-/g, "");
  return `elv_${id}`;
}

export type CreateIntentResult =
  | { ok: true; orderId: string; amountKrw: number }
  | { ok: false; error: string };

/** Minor units for `content_products.price_cents` matching `formatCurrencyMinor` (KRW × 100). */
const POC_PRICE_CENTS = TOSS_POC_AMOUNT_KRW * 100;

/**
 * Creates a pending row (service role) for the Toss payment widget PoC.
 * Optional `contentProductSlug` links the order to a catalog row for post-payment entitlement.
 */
export async function createTossPaymentIntent(
  amountKrw: number = TOSS_POC_AMOUNT_KRW,
  contentProductSlug?: string | null,
): Promise<CreateIntentResult> {
  if (amountKrw !== TOSS_POC_AMOUNT_KRW) {
    return { ok: false, error: `PoC only supports ${TOSS_POC_AMOUNT_KRW} KRW.` };
  }
  if (!getTossWidgetClientKey()) {
    return {
      ok: false,
      error:
        "Missing NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY. Add it to .env.local for the payment widget.",
    };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  let contentProductId: string | null = null;
  if (contentProductSlug?.trim()) {
    const { data: product, error: pErr } = await admin
      .from("content_products")
      .select("id, price_cents")
      .eq("slug", contentProductSlug.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (pErr || !product) {
      return { ok: false, error: "Unknown or inactive catalog product." };
    }
    if (product.price_cents !== POC_PRICE_CENTS) {
      return {
        ok: false,
        error: `PoC checkout only supports catalog items priced at ${TOSS_POC_AMOUNT_KRW} KRW (minor units: ${POC_PRICE_CENTS}).`,
      };
    }
    contentProductId = product.id;
  }

  const orderId = generateOrderId();
  const { data: row, error } = await admin
    .from("toss_payment_intents")
    .insert({
      organization_id: auth.ctx.organizationId,
      created_by: auth.ctx.userId,
      order_id: orderId,
      amount_krw: amountKrw,
      status: "pending",
      ...(contentProductId ? { content_product_id: contentProductId } : {}),
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "Failed to create payment intent" };
  }

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.PAYMENT_INTENT_CREATE,
    entityType: AuditEntityType.PAYMENT,
    entityId: row.id,
    metadata: {
      order_id: orderId,
      amount_krw: amountKrw,
      content_product_id: contentProductId,
    },
  });

  revalidatePath("/dashboard/billing");
  return { ok: true, orderId, amountKrw };
}

export type ConfirmRedirectResult =
  | { ok: true; alreadyConfirmed?: boolean }
  | { ok: false; error: string };

/**
 * 승인 API 호출 + DB 반영. 성공 리다이렉트 URL에서 호출.
 */
export async function confirmTossPaymentFromRedirect(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmRedirectResult> {
  const { paymentKey, orderId, amount } = params;
  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return { ok: false, error: "Missing payment parameters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    return { ok: false, error: "No organization." };
  }

  const admin = createAdminClient();
  const { data: intent } = await admin
    .from("toss_payment_intents")
    .select("id, organization_id, amount_krw, status, content_product_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!intent) {
    return { ok: false, error: "Unknown order. Create a new payment from Billing." };
  }
  if (intent.organization_id !== profile.organization_id) {
    return { ok: false, error: "Order does not belong to your organization." };
  }
  if (intent.amount_krw !== amount) {
    return { ok: false, error: "Amount mismatch." };
  }
  if (intent.status === "confirmed") {
    if (intent.content_product_id) {
      await grantOrganizationContentEntitlement(
        admin,
        intent.organization_id,
        intent.content_product_id,
      );
    }
    return { ok: true, alreadyConfirmed: true };
  }

  const confirmed = await tossConfirmPayment({
    paymentKey,
    orderId,
    amount,
  });
  if (!confirmed.ok) {
    const { data: current } = await admin
      .from("toss_payment_intents")
      .select("status")
      .eq("order_id", orderId)
      .maybeSingle();
    if (current?.status === "confirmed") {
      return { ok: true, alreadyConfirmed: true };
    }
    return { ok: false, error: confirmed.message };
  }

  const now = new Date().toISOString();
  const { error: upErr } = await admin
    .from("toss_payment_intents")
    .update({
      status: "confirmed",
      payment_key: paymentKey,
      confirmed_at: now,
    })
    .eq("id", intent.id)
    .eq("status", "pending");

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  await logAudit({
    organizationId: intent.organization_id,
    actorId: user.id,
    action: AuditAction.PAYMENT_CONFIRMED,
    entityType: AuditEntityType.PAYMENT,
    entityId: intent.id,
    metadata: { order_id: orderId, amount_krw: amount, via: "redirect" },
  });

  if (intent.content_product_id) {
    const grant = await grantOrganizationContentEntitlement(
      admin,
      intent.organization_id,
      intent.content_product_id,
    );
    if (grant.ok) {
      await logAudit({
        organizationId: intent.organization_id,
        actorId: user.id,
        action: AuditAction.CONTENT_ENTITLEMENT_GRANT,
        entityType: AuditEntityType.CONTENT_PRODUCT,
        entityId: intent.content_product_id,
        metadata: { order_id: orderId, via: "redirect" },
      });
    }
  }

  revalidatePath("/dashboard/billing");
  return { ok: true };
}
