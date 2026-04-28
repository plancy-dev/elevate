import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  mapVariantIdToBlogTier,
  type BlogSubscriptionTier,
  type BlogSubscriptionStatus,
} from "@/lib/subscriptions/blog-subscription";

type AdminClient = SupabaseClient<Database>;

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);

type JsonRecord = Record<string, unknown>;

function asRecord(v: unknown): JsonRecord | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as JsonRecord;
  }
  return null;
}

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractPayload(body: unknown): {
  subscriptionId: string | null;
  variantId: number | null;
  userEmail: string | null;
  manageUrl: string | null;
  periodEnd: string | null;
} {
  const root = asRecord(body);
  const data = asRecord(root?.data);
  const attributes = asRecord(data?.attributes);
  const urls = asRecord(attributes?.urls);
  const userEmailRaw =
    asString(attributes?.user_email) ??
    asString(attributes?.customer_email) ??
    asString(attributes?.email);
  return {
    subscriptionId: asString(data?.id),
    variantId: asNumber(attributes?.variant_id),
    userEmail: userEmailRaw?.toLowerCase() ?? null,
    manageUrl:
      asString(urls?.customer_portal) ??
      asString(urls?.update_payment_method) ??
      null,
    periodEnd:
      asString(attributes?.renews_at) ??
      asString(attributes?.ends_at) ??
      asString(attributes?.trial_ends_at) ??
      null,
  };
}

function deriveStatus(eventName: string): BlogSubscriptionStatus {
  if (eventName === "subscription_cancelled") return "cancelled";
  if (eventName === "subscription_expired") return "expired";
  return "active";
}

export function deriveSubscriptionState(args: {
  eventName: string;
  variantTier: Extract<BlogSubscriptionTier, "monthly" | "annual"> | null;
  existingTier: BlogSubscriptionTier | null;
}): { tier: BlogSubscriptionTier; status: BlogSubscriptionStatus } {
  const status = deriveStatus(args.eventName);
  if (status === "expired") {
    return { tier: "free", status };
  }
  const fallbackTier =
    args.existingTier === "annual"
      ? "annual"
      : args.existingTier === "monthly"
        ? "monthly"
        : "monthly";
  return { tier: args.variantTier ?? fallbackTier, status };
}

async function resolveUserIdByEmail(
  admin: AdminClient,
  userEmail: string | null,
): Promise<string | null> {
  if (!userEmail) return null;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("email", userEmail)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function insertWebhookEventIfNew(args: {
  admin: AdminClient;
  eventId: string;
  eventName: string;
  subscriptionId: string | null;
  body: unknown;
}): Promise<boolean> {
  const { error } = await args.admin
    .from("user_blog_subscription_webhook_events")
    .insert({
      event_id: args.eventId,
      event_name: args.eventName,
      lemon_squeezy_subscription_id: args.subscriptionId,
      payment_provider: "lemonsqueezy",
      payment_subscription_id: args.subscriptionId,
      payload: (args.body ?? {}) as Database["public"]["Tables"]["user_blog_subscription_webhook_events"]["Insert"]["payload"],
    });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

export type LemonSubscriptionWebhookResult =
  | { kind: "noop" }
  | { kind: "skipped"; reason: string }
  | { kind: "processed" };

export async function processLemonSqueezySubscriptionWebhook(args: {
  admin: AdminClient;
  body: unknown;
  eventName: string;
  rawBody: string;
}): Promise<LemonSubscriptionWebhookResult> {
  if (!HANDLED_EVENTS.has(args.eventName)) {
    return { kind: "noop" };
  }

  const payload = extractPayload(args.body);
  const eventId = crypto
    .createHash("sha256")
    .update(`${args.eventName}:${args.rawBody}`)
    .digest("hex");

  const inserted = await insertWebhookEventIfNew({
    admin: args.admin,
    eventId,
    eventName: args.eventName,
    subscriptionId: payload.subscriptionId,
    body: args.body,
  });
  if (!inserted) return { kind: "noop" };

  const tierFromVariant = mapVariantIdToBlogTier(payload.variantId);
  const userId = await resolveUserIdByEmail(args.admin, payload.userEmail);
  if (!userId) {
    return { kind: "skipped", reason: "unknown_user" };
  }

  const { data: existing } = await args.admin
    .from("user_blog_subscriptions")
    .select("subscription_tier")
    .eq("user_id", userId)
    .maybeSingle();

  const next = deriveSubscriptionState({
    eventName: args.eventName,
    variantTier: tierFromVariant,
    existingTier: existing?.subscription_tier ?? null,
  });

  const upsertPayload: Database["public"]["Tables"]["user_blog_subscriptions"]["Insert"] = {
    user_id: userId,
    subscription_tier: next.tier,
    subscription_status: next.status,
    payment_provider: "lemonsqueezy",
    payment_subscription_id: payload.subscriptionId,
    payment_product_id:
      payload.variantId != null ? String(payload.variantId) : null,
    lemon_squeezy_subscription_id: payload.subscriptionId,
    lemon_squeezy_variant_id: payload.variantId,
    current_period_end: payload.periodEnd,
    manage_subscription_url: payload.manageUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await args.admin
    .from("user_blog_subscriptions")
    .upsert(upsertPayload, { onConflict: "user_id" });
  if (error) {
    return { kind: "skipped", reason: "upsert_failed" };
  }
  return { kind: "processed" };
}
