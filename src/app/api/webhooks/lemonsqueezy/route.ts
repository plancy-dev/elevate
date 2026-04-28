import { NextResponse } from "next/server";
import { getLemonWebhookEventName } from "@/lib/payments/lemon-squeezy-request";
import { verifyLemonSqueezySignature } from "@/lib/payments/lemon-squeezy-signature";
import { processLemonSqueezyOrderWebhook } from "@/lib/payments/lemon-squeezy-webhook";
import { processLemonSqueezySubscriptionWebhook } from "@/lib/payments/lemon-squeezy-subscription-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lemon Squeezy webhook target (order_created → org content entitlement when paid).
 * Register in Lemon dashboard: `https://<your-domain>/api/webhooks/lemonsqueezy`
 * Use the same signing secret as `LEMON_SQUEEZY_WEBHOOK_SECRET`.
 *
 * @see https://docs.lemonsqueezy.com/help/webhooks/webhook-requests
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();

  if (secret) {
    const sig = req.headers.get("x-signature");
    if (!verifyLemonSqueezySignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "server misconfigured" }, { status: 503 });
  } else {
    console.warn(
      "[lemonsqueezy] LEMON_SQUEEZY_WEBHOOK_SECRET missing; signature not verified (dev only)",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventName = getLemonWebhookEventName(
    parsed,
    req.headers.get("x-event-name"),
  );

  if (!eventName) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  await processLemonSqueezyOrderWebhook(admin, parsed, eventName);
  await processLemonSqueezySubscriptionWebhook({
    admin,
    body: parsed,
    eventName,
    rawBody,
  });

  return NextResponse.json({ received: true });
}
