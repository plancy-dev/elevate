import { getLemonCheckoutUrlForSlug } from "@/lib/env/lemon-checkout-urls";
import { contentProductPriceMeetsLemonMinimum } from "@/lib/payments/lemon-custom-price-minimum";
import {
  createLemonCheckoutSession,
  getLemonSqueezyServerConfig,
} from "@/lib/payments/lemon-squeezy-api";
import { createAdminClient } from "@/lib/supabase/admin";

export type LemonCheckoutResolution =
  | {
      checkoutUrl: string;
      source: "api" | "env";
      embedsCustomDataInCheckout: boolean;
    }
  | {
      checkoutUrl: null;
      source: null;
      embedsCustomDataInCheckout: false;
      /** Machine-readable hint for i18n layer */
      reason:
        | "no_slug"
        | "unknown_product"
        | "not_linked"
        | "api_not_configured"
        | "checkout_api_failed"
        | "price_below_lemon_minimum";
      /** Optional developer-facing detail (dev only) */
      detail?: string;
    };

function isLemonTestModeDefault(): boolean {
  return process.env.LEMON_SQUEEZY_TEST_MODE === "true";
}

/**
 * Resolves a Lemon checkout URL for the billing page: prefers API-generated checkout
 * (embeds custom_data for webhooks) when `content_product_lemon_links` + API env exist;
 * falls back to legacy `NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG`.
 */
export async function resolveLemonCheckoutForBillingPage(opts: {
  contentProductSlug: string | null;
  organizationId: string | null;
  appOrigin: string;
  /**
   * Path (and optional query) on this app for Lemon `redirect_url` after payment.
   * Must start with `/`. Default: `/dashboard/billing/success`.
   */
  checkoutSuccessPath?: string;
}): Promise<LemonCheckoutResolution> {
  const slug = opts.contentProductSlug?.trim() ?? "";
  if (!slug) {
    return {
      checkoutUrl: null,
      source: null,
      embedsCustomDataInCheckout: false,
      reason: "no_slug",
    };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("content_products")
    .select("id, slug, price_cents, currency")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product?.id) {
    return {
      checkoutUrl: null,
      source: null,
      embedsCustomDataInCheckout: false,
      reason: "unknown_product",
    };
  }

  const { data: link } = await admin
    .from("content_product_lemon_links")
    .select("lemon_variant_id")
    .eq("content_product_id", product.id)
    .maybeSingle();

  const variantId = link?.lemon_variant_id?.trim();
  const apiCfg = getLemonSqueezyServerConfig();

  if (variantId && apiCfg) {
    if (!contentProductPriceMeetsLemonMinimum(Number(product.price_cents), product.currency)) {
      return {
        checkoutUrl: null,
        source: null,
        embedsCustomDataInCheckout: false,
        reason: "price_below_lemon_minimum",
      };
    }

    const customData: Record<string, string> = {
      content_product_id: product.id,
      content_product_slug: product.slug,
    };
    if (opts.organizationId) {
      customData.organization_id = opts.organizationId;
    }

    try {
      const rawPath = opts.checkoutSuccessPath?.trim();
      const successPath =
        rawPath && rawPath.startsWith("/") ? rawPath : "/dashboard/billing/success";
      const redirectUrl = `${opts.appOrigin.replace(/\/$/, "")}${successPath}`;
      const url = await createLemonCheckoutSession({
        variantId,
        customData,
        customPriceCents: product.price_cents,
        redirectUrl,
        testMode: isLemonTestModeDefault(),
      });
      return {
        checkoutUrl: url,
        source: "api",
        embedsCustomDataInCheckout: true,
      };
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      if (process.env.NODE_ENV === "development") {
        console.error("[resolveLemonCheckoutForBillingPage]", detail);
      }
      return {
        checkoutUrl: null,
        source: null,
        embedsCustomDataInCheckout: false,
        reason: "checkout_api_failed",
        detail,
      };
    }
  }

  if (variantId && !apiCfg) {
    return {
      checkoutUrl: null,
      source: null,
      embedsCustomDataInCheckout: false,
      reason: "api_not_configured",
    };
  }

  const envUrl = getLemonCheckoutUrlForSlug(slug);
  if (envUrl) {
    return {
      checkoutUrl: envUrl,
      source: "env",
      embedsCustomDataInCheckout: false,
    };
  }

  return {
    checkoutUrl: null,
    source: null,
    embedsCustomDataInCheckout: false,
    reason: "not_linked",
  };
}
