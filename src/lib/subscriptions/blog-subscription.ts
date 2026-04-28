import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const POLAR_MONTHLY_PRODUCT_ID = "3e8c060a-93ee-4ef0-8d4d-b62e92d66a5a";
export const POLAR_ANNUAL_PRODUCT_ID = "fd78d399-dc29-4126-86a6-5a91a1215894";

export type BlogSubscriptionTier = Database["public"]["Enums"]["blog_subscription_tier"];
export type BlogSubscriptionStatus = Database["public"]["Enums"]["blog_subscription_status"];

export type BlogSubscriptionRow =
  Database["public"]["Tables"]["user_blog_subscriptions"]["Row"];

export type BlogSubscriptionSnapshot = {
  tier: BlogSubscriptionTier;
  status: BlogSubscriptionStatus | null;
  currentPeriodEnd: string | null;
  manageSubscriptionUrl: string | null;
  paymentProvider?: string | null;
  paymentSubscriptionId?: string | null;
  paymentProductId?: string | null;
  lemonSubscriptionId: string | null;
  lemonVariantId: number | null;
};

export type BlogAccessDecision = {
  canReadFull: boolean;
  tier: BlogSubscriptionTier;
  previewRatio: number;
  requiredAccessTier: "public" | "member" | "premium";
};

const DEFAULT_PREVIEW_RATIO = 0.35;

export function canReadBlogPost(args: {
  accessTier: "public" | "member" | "premium";
  isAuthenticated: boolean;
  subscription: BlogSubscriptionSnapshot;
}): BlogAccessDecision {
  if (args.accessTier === "public") {
    return {
      canReadFull: true,
      tier: args.subscription.tier,
      previewRatio: 1,
      requiredAccessTier: "public",
    };
  }

  if (args.accessTier === "member") {
    return {
      canReadFull: args.isAuthenticated,
      tier: args.subscription.tier,
      previewRatio: DEFAULT_PREVIEW_RATIO,
      requiredAccessTier: "member",
    };
  }

  const paidTier =
    args.subscription.tier === "monthly" || args.subscription.tier === "annual";
  const active = args.subscription.status === "active";
  return {
    canReadFull: paidTier && active,
    tier: paidTier && active ? args.subscription.tier : "free",
    previewRatio: DEFAULT_PREVIEW_RATIO,
    requiredAccessTier: "premium",
  };
}

export function mapPaymentProductIdToBlogTier(
  productId: number | string | null | undefined,
): Extract<BlogSubscriptionTier, "monthly" | "annual"> | null {
  const raw = String(productId ?? "").trim();
  if (!raw) return null;
  if (raw === POLAR_MONTHLY_PRODUCT_ID) return "monthly";
  if (raw === POLAR_ANNUAL_PRODUCT_ID) return "annual";

  // Legacy numeric IDs (Lemon Squeezy variants) for backward compatibility.
  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (n === 1585015) return "monthly";
    if (n === 1585028) return "annual";
  }
  return null;
}

export function buildBlogSubscriptionCheckoutUrl(args: {
  productId: string;
  email?: string | null;
}): string {
  const base =
    process.env.NEXT_PUBLIC_POLAR_CHECKOUT_LINK?.trim() ||
    process.env.POLAR_CHECKOUT_LINK?.trim() ||
    "https://polar.sh/checkout";
  const url = new URL(base);
  url.searchParams.set("product_id", args.productId);
  const email = args.email?.trim();
  if (email) url.searchParams.set("customer_email", email);
  return url.toString();
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
      "subscription_tier, subscription_status, current_period_end, manage_subscription_url, payment_provider, payment_subscription_id, payment_product_id, lemon_squeezy_subscription_id, lemon_squeezy_variant_id",
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
    paymentProvider: data.payment_provider,
    paymentSubscriptionId:
      data.payment_subscription_id ?? data.lemon_squeezy_subscription_id,
    paymentProductId:
      data.payment_product_id ??
      (data.lemon_squeezy_variant_id != null
        ? String(data.lemon_squeezy_variant_id)
        : null),
    lemonSubscriptionId:
      data.lemon_squeezy_subscription_id ?? data.payment_subscription_id,
    lemonVariantId:
      data.lemon_squeezy_variant_id ??
      (data.payment_product_id && /^\d+$/.test(data.payment_product_id)
        ? Number(data.payment_product_id)
        : null),
  };
}

export function canReadPremiumBlogPost(args: {
  isPremium: boolean;
  subscription: BlogSubscriptionSnapshot;
}): BlogAccessDecision {
  return canReadBlogPost({
    accessTier: args.isPremium ? "premium" : "public",
    isAuthenticated: true,
    subscription: args.subscription,
  });
}

/** @deprecated Use `mapPaymentProductIdToBlogTier` */
export const mapVariantIdToBlogTier = mapPaymentProductIdToBlogTier;
