"use client";

import { usePostHog } from "posthog-js/react";
import { useTranslations } from "next-intl";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

type Props = {
  productId: string;
};

/**
 * PDF catalog assets: default link forces save via Storage `download` signed URL;
 * separate “Open” uses `disposition=inline` for in-browser viewing.
 */
export function LibraryPdfDownloadActions({ productId }: Props) {
  const t = useTranslations("Dashboard.library");
  const posthog = usePostHog();
  const base = `/api/content/${productId}/download`;

  function capture(disposition: "download" | "inline") {
    posthog?.capture(PostHogEvent.ELEVATE_FUNNEL_ASSET_DOWNLOAD, {
      product_id: productId,
      disposition,
    });
  }

  return (
    <div className="mt-2 flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
      <a
        href={base}
        className="text-sm font-medium text-primary hover:underline"
        onClick={() => capture("download")}
      >
        {t("download")}
      </a>
      <span className="hidden text-ink-500 sm:inline" aria-hidden>
        ·
      </span>
      <a
        href={`${base}?disposition=inline`}
        className="text-sm font-medium text-ink-700 hover:text-primary hover:underline"
        target="_blank"
        rel="noreferrer"
        onClick={() => capture("inline")}
      >
        {t("openInBrowser")}
      </a>
    </div>
  );
}
