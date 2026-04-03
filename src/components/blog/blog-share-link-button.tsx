"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useTranslations } from "next-intl";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

type Props = {
  url: string;
  slug: string;
  locale: string;
};

export function BlogShareLinkButton({ url, slug, locale }: Props) {
  const t = useTranslations("Blog");
  const posthog = usePostHog();
  const [hint, setHint] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="text-sm font-medium text-interactive underline-offset-2 hover:underline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setHint("copied");
            posthog?.capture(PostHogEvent.ELEVATE_BLOG_POST_SHARE_LINK_COPIED, {
              slug,
              locale,
            });
            window.setTimeout(() => setHint("idle"), 2000);
          } catch {
            setHint("failed");
            window.setTimeout(() => setHint("idle"), 3000);
          }
        }}
      >
        {t("shareLink")}
      </button>
      {hint === "copied" ? (
        <span className="text-xs text-text-tertiary" role="status">
          {t("shareCopied")}
        </span>
      ) : null}
      {hint === "failed" ? (
        <span className="text-xs text-text-tertiary" role="status">
          {t("shareFailed")}
        </span>
      ) : null}
    </div>
  );
}
