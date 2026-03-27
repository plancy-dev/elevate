"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTossWidgetClientKey } from "@/lib/env/toss";
import { tossConfirmPayment } from "@/lib/payments/toss-api";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";
import { revalidatePath } from "next/cache";

function generateOrderId(): string {
  const id = crypto.randomUUID().replace(/-/g, "");
  return `elv_${id}`;
}

export type CreateIntentResult =
  | { ok: true; orderId: string; amountKrw: number }
  | { ok: false; error: string };

/**
 * Creates a pending row (service role) for the Toss payment widget PoC.
 */
export async function createTossPaymentIntent(
  amountKrw: number = TOSS_POC_AMOUNT_KRW,
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

  const orderId = generateOrderId();
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("toss_payment_intents")
    .insert({
      organization_id: auth.ctx.organizationId,
      created_by: auth.ctx.userId,
      order_id: orderId,
      amount_krw: amountKrw,
      status: "pending",
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
    metadata: { order_id: orderId, amount_krw: amountKrw },
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
    .select("id, organization_id, amount_krw, status")
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

  revalidatePath("/dashboard/billing");
  return { ok: true };
}
