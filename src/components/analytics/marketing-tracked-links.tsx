"use client";

import type { ComponentProps, ReactNode } from "react";
import NextLink from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Link } from "@/i18n/navigation";
import { buildMarketingCtaClickProperties } from "@/lib/analytics/marketing-cta-click-properties";
import {
  MarketingCtaId,
  PostHogEvent,
} from "@/lib/analytics/posthog-events";

export { buildMarketingCtaClickProperties } from "@/lib/analytics/marketing-cta-click-properties";

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
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <Link
      {...rest}
      onClick={(e) => {
        posthog?.capture(
          PostHogEvent.ELEVATE_MARKETING_CTA_CLICK,
          buildMarketingCtaClickProperties({
            ctaId,
            locale,
            eventProperties,
            referrerPath: pathname,
          }),
        );
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
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <NextLink
      href={href}
      className={className}
      onClick={() =>
        posthog?.capture(
          PostHogEvent.ELEVATE_MARKETING_CTA_CLICK,
          buildMarketingCtaClickProperties({
            ctaId,
            locale,
            eventProperties,
            referrerPath: pathname,
          }),
        )
      }
    >
      {children}
    </NextLink>
  );
}

type ExternalAnchorProps = {
  href: string;
  ctaId: CtaId;
  className?: string;
  children: ReactNode;
  eventProperties?: EventProperties;
};

/** External / checkout `<a>` with ADR-013 marketing CTA capture (opens new tab). */
export function MarketingTrackedExternalAnchor({
  href,
  ctaId,
  className,
  children,
  eventProperties,
}: ExternalAnchorProps) {
  const posthog = usePostHog();
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        posthog?.capture(
          PostHogEvent.ELEVATE_MARKETING_CTA_CLICK,
          buildMarketingCtaClickProperties({
            ctaId,
            locale,
            eventProperties,
            referrerPath: pathname,
          }),
        )
      }
    >
      {children}
    </a>
  );
}
