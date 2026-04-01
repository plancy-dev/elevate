"use client";

import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { FunnelCaptureOnce } from "./funnel-capture";

type Props = {
  productSlug: string | null;
};

export function BillingFunnelCapture({ productSlug }: Props) {
  return (
    <FunnelCaptureOnce
      event={PostHogEvent.ELEVATE_FUNNEL_BILLING_VIEW}
      properties={
        productSlug ? { product_slug: productSlug } : { checkout: "poc_generic" }
      }
    />
  );
}
