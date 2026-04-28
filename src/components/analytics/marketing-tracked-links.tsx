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
type EventProperties = Record<string, string | number | boolean | null>;

type LocaleLinkProps = ComponentProps<typeof Link> & {
  ctaId: CtaId;
  eventProperties?: EventProperties;
};

/** Locale-aware marketing link with PostHog `elevate_marketing_cta_click`. */
export function MarketingTrackedLocaleLink({
  ctaId,
  eventProperties,
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
          ...eventProperties,
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
  eventProperties?: EventProperties;
  className?: string;
  children: ReactNode;
};

/** Non-locale path (e.g. `/signup`) with the same CTA event. */
export function MarketingTrackedNextLink({
  href,
  ctaId,
  eventProperties,
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
          ...eventProperties,
        })
      }
    >
      {children}
    </NextLink>
  );
}
