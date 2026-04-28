import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const LEMON_MONTHLY_VARIANT_ID = 1585015;
export const LEMON_ANNUAL_VARIANT_ID = 1585028;

export type BlogSubscriptionTier = Database["public"]["Enums"]["blog_subscription_tier"];
export type BlogSubscriptionStatus = Database["public"]["Enums"]["blog_subscription_status"];

export type BlogSubscriptionRow =
  Database["public"]["Tables"]["user_blog_subscriptions"]["Row"];

export type BlogSubscriptionSnapshot = {
  tier: BlogSubscriptionTier;
  status: BlogSubscriptionStatus | null;
  currentPeriodEnd: string | null;
  manageSubscriptionUrl: string | null;
  lemonSubscriptionId: string | null;
  lemonVariantId: number | null;
};

export type BlogAccessDecision = {
  canReadFull: boolean;
  tier: BlogSubscriptionTier;
  previewRatio: number;
};

const DEFAULT_PREVIEW_RATIO = 0.35;

export function mapVariantIdToBlogTier(
  variantId: number | string | null | undefined,
): Extract<BlogSubscriptionTier, "monthly" | "annual"> | null {
  const n =
    typeof variantId === "number"
      ? variantId
      : typeof variantId === "string"
        ? Number(variantId)
        : NaN;
  if (!Number.isFinite(n)) return null;
  if (n === LEMON_MONTHLY_VARIANT_ID) return "monthly";
  if (n === LEMON_ANNUAL_VARIANT_ID) return "annual";
  return null;
}

export function buildBlogSubscriptionCheckoutUrl(args: {
  variantId: number;
  email?: string | null;
}): string {
  const base = `https://elevate.lemonsqueezy.com/checkout/buy/${args.variantId}`;
  const email = args.email?.trim();
  if (!email) return base;
  const params = new URLSearchParams();
  params.set("checkout[email]", email);
  return `${base}?${params.toString()}`;
}

export async function getBlogSubscriptionByUserId(
  supabase: SupabaseClient<Database>,
  userId: string | null,
): Promise<BlogSubscriptionSnapshot> {
  if (!userId) {
    return {
      tier: "free",
      status: null,
      currentPeriodEnd: null,
      manageSubscriptionUrl: null,
      lemonSubscriptionId: null,
      lemonVariantId: null,
    };
  }
  const { data } = await supabase
    .from("user_blog_subscriptions")
    .select(
      "subscription_tier, subscription_status, current_period_end, manage_subscription_url, lemon_squeezy_subscription_id, lemon_squeezy_variant_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return {
      tier: "free",
      status: null,
      currentPeriodEnd: null,
      manageSubscriptionUrl: null,
      lemonSubscriptionId: null,
      lemonVariantId: null,
    };
  }

  return {
    tier: data.subscription_tier,
    status: data.subscription_status,
    currentPeriodEnd: data.current_period_end,
    manageSubscriptionUrl: data.manage_subscription_url,
    lemonSubscriptionId: data.lemon_squeezy_subscription_id,
    lemonVariantId: data.lemon_squeezy_variant_id,
  };
}

export function canReadPremiumBlogPost(args: {
  isPremium: boolean;
  subscription: BlogSubscriptionSnapshot;
}): BlogAccessDecision {
  if (!args.isPremium) {
    return { canReadFull: true, tier: args.subscription.tier, previewRatio: 1 };
  }
  const paidTier =
    args.subscription.tier === "monthly" || args.subscription.tier === "annual";
  const active = args.subscription.status === "active";
  return {
    canReadFull: paidTier && active,
    tier: paidTier && active ? args.subscription.tier : "free",
    previewRatio: DEFAULT_PREVIEW_RATIO,
  };
}
