import type { Metadata } from "next";
import { PostHogRoot } from "@/components/analytics/posthog-root";
import {
  getPosthogPublicConfig,
  isPosthogBrowserDebugEnabled,
} from "@/lib/env/posthog-public";
import { getSiteUrl } from "@/lib/seo/site-url";
import {
  GOOGLE_SITE_VERIFICATION_CONTENT,
  NAVER_SITE_VERIFICATION_CONTENT,
} from "@/lib/seo/site-verification";
import { SupabaseUrlHashHandler } from "@/components/auth/supabase-url-hash-handler";
import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

/* eslint-disable @next/next/no-page-custom-font */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    types: {
      "application/atom+xml": "/feed.xml",
    },
  },
  title: {
    default: "Elevate AI — Prompt improvement & early access",
    template: "%s | Elevate",
  },
  description:
    "Elevate AI: model-aware prompt improvement—our first MVP. Join the waitlist for Prompt Studio beta; blog and catalog support growth. Org-scoped workspace.",
  keywords: [
    "Elevate AI",
    "Prompt Studio",
    "prompt improvement",
    "AI",
    "B2B SaaS",
    "enterprise AI",
    "e-books",
    "organization",
    "Supabase",
  ],
  openGraph: {
    title: "Elevate AI — Prompt improvement & early access",
    description:
      "Improve prompts with structured analysis; join the waitlist for Prompt Studio beta. Library and catalog in parallel.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-default.webp",
        width: 1200,
        height: 630,
        alt: "Elevate — AI workflows for serious teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  /** Naver Search Advisor (site ownership) — all public pages inherit from root layout */
  other: {
    "naver-site-verification": NAVER_SITE_VERIFICATION_CONTENT,
  },
  ...(GOOGLE_SITE_VERIFICATION_CONTENT
    ? {
        verification: {
          google: GOOGLE_SITE_VERIFICATION_CONTENT,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posthogPublic = getPosthogPublicConfig();
  const posthogDebug = isPosthogBrowserDebugEnabled();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => {
  const attr = "data-cursor-ref";
  const stripNode = (node) => {
    if (!(node instanceof Element)) return;
    if (node.hasAttribute(attr)) node.removeAttribute(attr);
    const nested = node.querySelectorAll("[" + attr + "]");
    for (const el of nested) el.removeAttribute(attr);
  };
  const stripAll = () => {
    const nodes = document.querySelectorAll("[" + attr + "]");
    for (const el of nodes) el.removeAttribute(attr);
  };
  try {
    stripAll();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.type === "attributes" &&
          record.attributeName === attr &&
          record.target instanceof Element
        ) {
          record.target.removeAttribute(attr);
        }
        if (record.type === "childList") {
          for (const node of record.addedNodes) stripNode(node);
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [attr],
    });
    window.addEventListener(
      "load",
      () => {
        setTimeout(() => observer.disconnect(), 2000);
      },
      { once: true },
    );
  } catch {}
})();`,
            }}
          />
        ) : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body
        className="min-h-screen bg-paper-50 font-sans text-ink-900 antialiased"
        suppressHydrationWarning
      >
        <AppThemeProvider>
          <PostHogRoot
            initialPublicConfig={posthogPublic}
            debug={posthogDebug}
          >
            <SupabaseUrlHashHandler />
            {children}
            <AppToaster />
          </PostHogRoot>
        </AppThemeProvider>
      </body>
    </html>
  );
}
