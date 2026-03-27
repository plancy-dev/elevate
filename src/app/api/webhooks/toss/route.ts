import { NextResponse } from "next/server";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

/**
 * Toss Payments PAYMENT_STATUS_CHANGED (and other) webhook target.
 * Register in Toss dashboard: `https://<your-domain>/api/webhooks/toss`
 * Local testing requires ngrok (see Toss docs).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (b.eventType === "PAYMENT_STATUS_CHANGED") {
    const data = b.data as Record<string, unknown> | undefined;
    const orderId = typeof data?.orderId === "string" ? data.orderId : null;
    const status = typeof data?.status === "string" ? data.status : null;
    const paymentKey = typeof data?.paymentKey === "string" ? data.paymentKey : null;

    if (orderId && status === "DONE" && paymentKey) {
      const admin = createAdminClient();
      const { data: intent } = await admin
        .from("toss_payment_intents")
        .select("id, organization_id, created_by, status")
        .eq("order_id", orderId)
        .maybeSingle();

      if (intent?.status === "pending") {
        const now = new Date().toISOString();
        const { error } = await admin
          .from("toss_payment_intents")
          .update({
            status: "confirmed",
            payment_key: paymentKey,
            confirmed_at: now,
            last_webhook_at: now,
            last_webhook_payload: body as Json,
          })
          .eq("id", intent.id)
          .eq("status", "pending");

        if (!error) {
          await logAudit({
            organizationId: intent.organization_id,
            actorId: intent.created_by,
            action: AuditAction.PAYMENT_WEBHOOK,
            entityType: AuditEntityType.PAYMENT,
            entityId: intent.id,
            metadata: { order_id: orderId, status, source: "webhook" },
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
