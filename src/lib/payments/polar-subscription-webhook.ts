import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  mapPaymentProductIdToBlogTier,
  type BlogSubscriptionStatus,
  type BlogSubscriptionTier,
} from "@/lib/subscriptions/blog-subscription";

type AdminClient = SupabaseClient<Database>;
type JsonRecord = Record<string, unknown>;

const HANDLED_EVENTS = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.past_due",
  "subscription.revoked",
]);

function asRecord(v: unknown): JsonRecord | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as JsonRecord;
  return null;
}

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    const found = asString(value);
    if (found) return found;
  }
  return null;
}

function resolveStatus(args: {
  eventType: string;
  payloadStatus: string | null;
}): BlogSubscriptionStatus {
  const status = (args.payloadStatus ?? "").toLowerCase();
  if (args.eventType === "subscription.revoked") return "expired";
  if (status === "past_due" || args.eventType === "subscription.past_due") {
    return "past_due";
  }
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "expired") return "expired";
  return "active";
}

export function derivePolarSubscriptionState(args: {
  eventType: string;
  payloadStatus: string | null;
  productId: string | null;
  existingTier: BlogSubscriptionTier | null;
}): { tier: BlogSubscriptionTier; status: BlogSubscriptionStatus } {
  const status = resolveStatus({
    eventType: args.eventType,
    payloadStatus: args.payloadStatus,
  });
  if (status === "expired") {
    return { tier: "free", status };
  }
  const mappedTier = mapPaymentProductIdToBlogTier(args.productId);
  const fallbackTier =
    args.existingTier === "annual"
      ? "annual"
      : args.existingTier === "monthly"
        ? "monthly"
        : "monthly";
  return { tier: mappedTier ?? fallbackTier, status };
}

function extractPayload(body: unknown): {
  eventType: string | null;
  subscriptionId: string | null;
  productId: string | null;
  userEmail: string | null;
  payloadStatus: string | null;
  periodEnd: string | null;
  manageUrl: string | null;
} {
  const root = asRecord(body);
  const data = asRecord(root?.data);
  const customer = asRecord(data?.customer);
  const metadata = asRecord(data?.metadata);
  const product = asRecord(data?.product);
  const links = asRecord(root?.links);

  const eventType = asString(root?.type);
  const payloadStatus = asString(data?.status);
  const subscriptionId = pickString(data?.id, data?.subscription_id);
  const productId = pickString(
    data?.product_id,
    product?.id,
    data?.price_id,
    data?.priceId,
  );
  const userEmail = pickString(
    data?.customer_email,
    data?.email,
    customer?.email,
    metadata?.email,
  )?.toLowerCase();
  const periodEnd = pickString(
    data?.current_period_end,
    data?.current_period_end_at,
    data?.ends_at,
    data?.end_date,
  );
  const manageUrl = pickString(
    data?.customer_portal_url,
    data?.manage_url,
    links?.customer_portal,
  );
  return {
    eventType,
    subscriptionId,
    productId,
    userEmail: userEmail ?? null,
    payloadStatus,
    periodEnd,
    manageUrl,
  };
}

async function resolveUserId(admin: AdminClient, email: string | null) {
  if (!email) return null;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function insertEventIfNew(args: {
  admin: AdminClient;
  eventId: string;
  eventType: string;
  subscriptionId: string | null;
  body: unknown;
}) {
  const { error } = await args.admin
    .from("user_blog_subscription_webhook_events")
    .insert({
      event_id: args.eventId,
      event_name: args.eventType,
      lemon_squeezy_subscription_id: args.subscriptionId,
      payment_provider: "polar",
      payment_subscription_id: args.subscriptionId,
      payload: (args.body ?? {}) as Database["public"]["Tables"]["user_blog_subscription_webhook_events"]["Insert"]["payload"],
    });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

export type PolarWebhookSyncResult =
  | { kind: "noop" }
  | { kind: "skipped"; reason: string }
  | { kind: "processed" };

export async function processPolarSubscriptionWebhook(args: {
  admin: AdminClient;
  body: unknown;
  rawBody: string;
  headerEventType?: string | null;
  deliveryId?: string | null;
}): Promise<PolarWebhookSyncResult> {
  const payload = extractPayload(args.body);
  const eventType = (args.headerEventType?.trim() || payload.eventType || "").trim();
  if (!HANDLED_EVENTS.has(eventType)) return { kind: "noop" };

  const eventId =
    args.deliveryId?.trim() ||
    crypto.createHash("sha256").update(`${eventType}:${args.rawBody}`).digest("hex");
  const inserted = await insertEventIfNew({
    admin: args.admin,
    eventId,
    eventType,
    subscriptionId: payload.subscriptionId,
    body: args.body,
  });
  if (!inserted) return { kind: "noop" };

  const userId = await resolveUserId(args.admin, payload.userEmail);
  if (!userId) return { kind: "skipped", reason: "unknown_user" };

  const { data: existing } = await args.admin
    .from("user_blog_subscriptions")
    .select("subscription_tier")
    .eq("user_id", userId)
    .maybeSingle();
  const next = derivePolarSubscriptionState({
    eventType,
    payloadStatus: payload.payloadStatus,
    productId: payload.productId,
    existingTier: existing?.subscription_tier ?? null,
  });

  const legacyVariantId =
    payload.productId && /^\d+$/.test(payload.productId)
      ? Number(payload.productId)
      : null;

  const upsertPayload: Database["public"]["Tables"]["user_blog_subscriptions"]["Insert"] = {
    user_id: userId,
    subscription_tier: next.tier,
    subscription_status: next.status,
    payment_provider: "polar",
    payment_subscription_id: payload.subscriptionId,
    payment_product_id: payload.productId,
    lemon_squeezy_subscription_id: payload.subscriptionId,
    lemon_squeezy_variant_id: legacyVariantId,
    current_period_end: payload.periodEnd,
    manage_subscription_url: payload.manageUrl,
    updated_at: new Date().toISOString(),
  };
  const { error } = await args.admin
    .from("user_blog_subscriptions")
    .upsert(upsertPayload, { onConflict: "user_id" });
  if (error) return { kind: "skipped", reason: "upsert_failed" };

  return { kind: "processed" };
}

