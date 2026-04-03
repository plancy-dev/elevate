"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

type Props = {
  productId: string;
  slug: string;
  children: ReactNode;
};

export function LibraryReadOnlineButton({ productId, slug, children }: Props) {
  const posthog = usePostHog();

  return (
    <Link
      href={`/dashboard/library/${encodeURIComponent(slug)}/read`}
      className="text-sm font-medium text-primary hover:underline mt-2 inline-block"
      onClick={() => {
        posthog?.capture(PostHogEvent.ELEVATE_FUNNEL_EBOOK_READER_LINK_CLICK, {
          product_id: productId,
          slug,
        });
      }}
    >
      {children}
    </Link>
  );
}
