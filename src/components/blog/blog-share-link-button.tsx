"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePostHog } from "posthog-js/react";
import { useTranslations } from "next-intl";
import { AtSign, Mail, Share2, X } from "lucide-react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { captureBlogShareChannel } from "@/lib/analytics/capture-blog-share";
import { buildBlogShareUrls, type BlogShareUrls } from "@/lib/blog/build-share-urls";
import {
  BlogShareChannel,
  type BlogShareChannelId,
} from "@/lib/blog/share-channel";
import {
  IconFacebook,
  IconLinkedIn,
  IconXLogo,
} from "@/components/blog/blog-share-icons";

type Props = {
  url: string;
  slug: string;
  locale: string;
  title: string;
};

type ShareLabelKey =
  | "shareX"
  | "shareThreads"
  | "shareFacebook"
  | "shareLinkedIn"
  | "shareEmail";

type PlatformRow =
  | {
      kind: "button";
      channel: BlogShareChannelId;
      href: (urls: BlogShareUrls) => string;
      labelKey: ShareLabelKey;
      circleClass: string;
      renderIcon: () => ReactNode;
    }
  | {
      kind: "mailto";
      channel: typeof BlogShareChannel.EMAIL;
      href: (urls: BlogShareUrls) => string;
      labelKey: ShareLabelKey;
      circleClass: string;
      renderIcon: () => ReactNode;
    };

const PLATFORM_ROWS: PlatformRow[] = [
  {
    kind: "button",
    channel: BlogShareChannel.X,
    href: (u) => u.x,
    labelKey: "shareX",
    circleClass: "bg-[#0f1419] text-white",
    renderIcon: () => <IconXLogo className="h-5 w-5" />,
  },
  {
    kind: "button",
    channel: BlogShareChannel.THREADS,
    href: (u) => u.threads,
    labelKey: "shareThreads",
    circleClass: "bg-[#0f1419] text-white",
    renderIcon: () => <AtSign className="h-5 w-5" aria-hidden />,
  },
  {
    kind: "button",
    channel: BlogShareChannel.FACEBOOK,
    href: (u) => u.facebook,
    labelKey: "shareFacebook",
    circleClass: "bg-[#1877f2] text-white",
    renderIcon: () => <IconFacebook className="h-5 w-5" />,
  },
  {
    kind: "button",
    channel: BlogShareChannel.LINKEDIN,
    href: (u) => u.linkedin,
    labelKey: "shareLinkedIn",
    circleClass: "bg-[#0a66c2] text-white",
    renderIcon: () => <IconLinkedIn className="h-5 w-5" />,
  },
  {
    kind: "mailto",
    channel: BlogShareChannel.EMAIL,
    href: (u) => u.email,
    labelKey: "shareEmail",
    circleClass: "bg-layer-03 text-text-primary",
    renderIcon: () => <Mail className="h-5 w-5" aria-hidden />,
  },
];

const shareRowClass =
  "flex w-[4.5rem] flex-col items-center gap-1.5 rounded-xl p-2 text-center text-xs text-text-secondary transition-colors hover:bg-layer-02";

export function BlogShareLinkButton({ url, slug, locale, title }: Props) {
  const t = useTranslations("Blog");
  const posthog = usePostHog();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [hint, setHint] = useState<"idle" | "copied" | "failed">("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const shareUrls = buildBlogShareUrls(title, url);

  const openDialog = useCallback(() => {
    dialogRef.current?.showModal();
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
    setDialogOpen(false);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onDialogClose = () => setDialogOpen(false);
    el.addEventListener("close", onDialogClose);
    return () => el.removeEventListener("close", onDialogClose);
  }, []);

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setHint("copied");
      captureBlogShareChannel(posthog, {
        slug,
        locale,
        channel: BlogShareChannel.COPY,
      });
      posthog?.capture(PostHogEvent.ELEVATE_BLOG_POST_SHARE_LINK_COPIED, {
        slug,
        locale,
      });
      window.setTimeout(() => setHint("idle"), 2000);
    } catch {
      setHint("failed");
      window.setTimeout(() => setHint("idle"), 3000);
    }
  }, [posthog, slug, locale, url]);

  const openChannel = useCallback(
    (href: string, channel: BlogShareChannelId) => {
      captureBlogShareChannel(posthog, { slug, locale, channel });
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [posthog, slug, locale],
  );

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-layer-01 px-3.5 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-layer-02 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-haspopup="dialog"
        aria-expanded={dialogOpen}
      >
        <Share2 className="h-4 w-4 shrink-0 text-interactive" aria-hidden />
        {t("shareOpen")}
      </button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,26rem)] max-h-[min(90vh,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-subtle bg-layer-01 p-0 text-text-primary shadow-2xl [&::backdrop]:bg-black/50"
        aria-labelledby={titleId}
      >
        <div className="flex max-h-[min(90vh,40rem)] flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <h2 id={titleId} className="text-base font-semibold text-text-primary">
              {t("shareOpen")}
            </h2>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md p-1.5 text-text-secondary hover:bg-layer-02 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              aria-label={t("shareClose")}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="overflow-y-auto px-4 pb-4 pt-3">
            <p className="mb-3 text-xs text-text-tertiary">{t("sharePickPlatform")}</p>
            <ul className="mb-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              {PLATFORM_ROWS.map((row) => {
                const href = row.href(shareUrls);
                const label = t(row.labelKey);
                const circle = (
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${row.circleClass}`}
                  >
                    {row.renderIcon()}
                  </span>
                );
                if (row.kind === "mailto") {
                  return (
                    <li key={row.channel}>
                      <a
                        href={href}
                        className={shareRowClass}
                        onClick={() =>
                          captureBlogShareChannel(posthog, {
                            slug,
                            locale,
                            channel: row.channel,
                          })
                        }
                      >
                        {circle}
                        <span className="leading-tight">{label}</span>
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={row.channel}>
                    <button
                      type="button"
                      onClick={() => openChannel(href, row.channel)}
                      className={shareRowClass}
                    >
                      {circle}
                      <span className="leading-tight">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-xl border border-border-subtle bg-layer-02 p-2">
              <label htmlFor={`share-url-${slug}`} className="sr-only">
                {t("shareUrlAria")}
              </label>
              <div className="flex gap-2">
                <input
                  id={`share-url-${slug}`}
                  readOnly
                  value={url}
                  className="min-w-0 flex-1 truncate rounded-md border-0 bg-transparent px-2 py-2 text-xs text-text-primary outline-none"
                />
                <button
                  type="button"
                  onClick={copyUrl}
                  className="shrink-0 rounded-lg bg-interactive px-3 py-2 text-xs font-medium text-text-on-color hover:bg-primary-hover"
                >
                  {t("shareCopyButton")}
                </button>
              </div>
            </div>

            {hint === "copied" ? (
              <p className="mt-2 text-xs text-text-tertiary" role="status">
                {t("shareCopied")}
              </p>
            ) : null}
            {hint === "failed" ? (
              <p className="mt-2 text-xs text-text-tertiary" role="status">
                {t("shareFailed")}
              </p>
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}
