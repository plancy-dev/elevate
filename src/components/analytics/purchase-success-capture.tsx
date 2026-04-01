"use client";

import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { FunnelCaptureOnce } from "./funnel-capture";

type Props = {
  ok: boolean;
};

export function PurchaseSuccessCapture({ ok }: Props) {
  if (!ok) return null;
  return (
    <FunnelCaptureOnce
      event={PostHogEvent.ELEVATE_FUNNEL_PURCHASE_COMPLETED}
    />
  );
}
