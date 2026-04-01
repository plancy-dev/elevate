"use client";

import type { ReactNode } from "react";
import { usePostHog } from "posthog-js/react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

type Props = {
  productId: string;
  children: ReactNode;
};

export function LibraryDownloadButton({ productId, children }: Props) {
  const posthog = usePostHog();

  return (
    <a
      href={`/api/content/${productId}/download`}
      className="text-sm font-medium text-primary hover:underline mt-2 inline-block"
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        posthog?.capture(PostHogEvent.ELEVATE_FUNNEL_ASSET_DOWNLOAD, {
          product_id: productId,
        });
      }}
    >
      {children}
    </a>
  );
}
