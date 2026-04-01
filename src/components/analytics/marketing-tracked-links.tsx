"use client";

import type { ComponentProps, ReactNode } from "react";
import NextLink from "next/link";
import { usePostHog } from "posthog-js/react";
import { Link } from "@/i18n/navigation";
import {
  MarketingCtaId,
  PostHogEvent,
} from "@/lib/analytics/posthog-events";

type CtaId = (typeof MarketingCtaId)[keyof typeof MarketingCtaId];

type LocaleLinkProps = ComponentProps<typeof Link> & { ctaId: CtaId };

/** Locale-aware marketing link with PostHog `elevate_marketing_cta_click`. */
export function MarketingTrackedLocaleLink({
  ctaId,
  onClick,
  children,
  ...rest
}: LocaleLinkProps) {
  const posthog = usePostHog();
  return (
    <Link
      {...rest}
      onClick={(e) => {
        posthog?.capture(PostHogEvent.ELEVATE_MARKETING_CTA_CLICK, {
          cta_id: ctaId,
        });
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}

type NextLinkProps = {
  href: string;
  ctaId: CtaId;
  className?: string;
  children: ReactNode;
};

/** Non-locale path (e.g. `/signup`) with the same CTA event. */
export function MarketingTrackedNextLink({
  href,
  ctaId,
  className,
  children,
}: NextLinkProps) {
  const posthog = usePostHog();
  return (
    <NextLink
      href={href}
      className={className}
      onClick={() =>
        posthog?.capture(PostHogEvent.ELEVATE_MARKETING_CTA_CLICK, {
          cta_id: ctaId,
        })
      }
    >
      {children}
    </NextLink>
  );
}
