"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

type Props = {
  slug: string;
  locale: string;
  title: string;
};

/** One custom event per blog post view (slug + locale + public title). See docs/CONTENT_FUNNEL.md */
export function BlogPostViewedCapture({ slug, locale, title }: Props) {
  const posthog = usePostHog();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !posthog) return;
    sent.current = true;
    posthog.capture(PostHogEvent.ELEVATE_BLOG_POST_VIEWED, {
      slug,
      locale,
      post_title: title,
    });
  }, [posthog, slug, locale, title]);

  return null;
}
