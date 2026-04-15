import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogRoot } from "@/components/analytics/posthog-root";
import { getSiteUrl } from "@/lib/seo/site-url";
import {
  GOOGLE_SITE_VERIFICATION_CONTENT,
  NAVER_SITE_VERIFICATION_CONTENT,
} from "@/lib/seo/site-verification";
import { SupabaseUrlHashHandler } from "@/components/auth/supabase-url-hash-handler";
import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AppThemeProvider>
          <PostHogRoot>
            <SupabaseUrlHashHandler />
            {children}
            <AppToaster />
          </PostHogRoot>
        </AppThemeProvider>
      </body>
    </html>
  );
}
