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
  if (!secret) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 503 });
  }

  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");
  const polarSignature = req.headers.get("polar-signature");
  const valid =
    verifyStandardWebhookSignature({
      rawBody,
      webhookId,
      webhookTimestamp,
      webhookSignature,
      secret,
    }) ||
    verifyLegacyPolarSignature({
      rawBody,
      headerSignature: polarSignature,
      secret,
    });
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const admin = createAdminClient();
  await processPolarSubscriptionWebhook({
    admin,
    body: parsed,
    rawBody,
    headerEventType: req.headers.get("polar-event"),
    deliveryId: webhookId,
  });

  return NextResponse.json({ received: true });
}

