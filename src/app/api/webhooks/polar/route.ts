import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processPolarSubscriptionWebhook } from "@/lib/payments/polar-subscription-webhook";

export const runtime = "nodejs";

function timingSafeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifyLegacyPolarSignature(args: {
  rawBody: string;
  headerSignature: string | null;
  secret: string;
}) {
  if (!args.headerSignature) return false;
  const expected = crypto
    .createHmac("sha256", args.secret)
    .update(args.rawBody)
    .digest("hex");
  return timingSafeEqual(expected, args.headerSignature.trim());
}

function verifyStandardWebhookSignature(args: {
  rawBody: string;
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
  secret: string;
}) {
  if (!args.webhookId || !args.webhookTimestamp || !args.webhookSignature) {
    return false;
  }
  const msg = `${args.webhookId}.${args.webhookTimestamp}.${args.rawBody}`;
  const signature = crypto
    .createHmac("sha256", args.secret)
    .update(msg)
    .digest("base64");
  const candidates = args.webhookSignature
    .split(" ")
    .flatMap((chunk) => chunk.split(","))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith("v1,") ? s.slice(3) : s));
  return candidates.some((provided) => timingSafeEqual(signature, provided));
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");
  const polarSignature = req.headers.get("polar-signature");
  const headerEventType = req.headers.get("polar-event");
  const eventTypeForLog =
    headerEventType ??
    (() => {
      try {
        const parsed = JSON.parse(rawBody) as { type?: unknown };
        return typeof parsed.type === "string" ? parsed.type : null;
      } catch {
        return null;
      }
    })();

  const logMeta = {
    delivery_id: webhookId ?? "missing",
    event_type: eventTypeForLog ?? "unknown",
    has_secret: Boolean(secret),
    has_webhook_id: Boolean(webhookId),
    has_webhook_timestamp: Boolean(webhookTimestamp),
    has_webhook_signature: Boolean(webhookSignature),
    has_legacy_polar_signature: Boolean(polarSignature),
  };

  console.info("[polar-webhook] received", logMeta);

  if (!secret) {
    console.error("[polar-webhook] misconfigured: missing POLAR_WEBHOOK_SECRET", logMeta);
    return NextResponse.json({ error: "server misconfigured" }, { status: 503 });
  }

  const validStandard = verifyStandardWebhookSignature({
    rawBody,
    webhookId,
    webhookTimestamp,
    webhookSignature,
    secret,
  });
  const validLegacy = verifyLegacyPolarSignature({
    rawBody,
    headerSignature: polarSignature,
    secret,
  });
  const valid = validStandard || validLegacy;
  if (!valid) {
    console.warn("[polar-webhook] signature verification failed", {
      ...logMeta,
      verification_mode: "none",
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  console.info("[polar-webhook] signature verified", {
    ...logMeta,
    verification_mode: validStandard ? "standard" : "legacy",
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    console.warn("[polar-webhook] invalid json payload", logMeta);
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    const result = await processPolarSubscriptionWebhook({
      admin,
      body: parsed,
      rawBody,
      headerEventType,
      deliveryId: webhookId,
    });
    console.info("[polar-webhook] processed", {
      ...logMeta,
      handler_result: result.kind,
      ...(result.kind === "skipped" ? { skip_reason: result.reason } : {}),
    });
  } catch (error) {
    console.error("[polar-webhook] handler error", {
      ...logMeta,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

