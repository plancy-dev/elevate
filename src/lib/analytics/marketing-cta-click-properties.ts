import { MarketingCtaId } from "@/lib/analytics/posthog-events";

type WireCtaId = (typeof MarketingCtaId)[keyof typeof MarketingCtaId];
type EventProperties = Record<string, string | number | boolean | null>;

/** ADR-013: required `cta_id` + `locale`; optional extras must stay non-PII. */
export function buildMarketingCtaClickProperties(args: {
  ctaId: WireCtaId;
  locale: string;
  eventProperties?: EventProperties;
  referrerPath?: string | null;
}): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {
    ...(args.eventProperties ?? {}),
  };
  out.cta_id = args.ctaId;
  out.locale = args.locale;
  if (args.referrerPath) {
    out.referrer_path = args.referrerPath;
  }
  return out;
}
