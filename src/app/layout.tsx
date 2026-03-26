import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { SupabaseUrlHashHandler } from "@/components/auth/supabase-url-hash-handler";
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
  title: {
    default: "Elevate — Enterprise MICE Event Platform",
    template: "%s | Elevate",
  },
  description:
    "The enterprise platform for MICE event management. Orchestrate conferences, exhibitions, and corporate meetings with AI-powered insights that drive measurable business outcomes.",
  keywords: [
    "MICE",
    "event management",
    "conference platform",
    "exhibition management",
    "corporate meetings",
    "enterprise events",
    "event analytics",
    "attendee engagement",
  ],
  openGraph: {
    title: "Elevate — Enterprise MICE Event Platform",
    description:
      "Orchestrate world-class events with AI-powered insights that drive measurable business outcomes.",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
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
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppThemeProvider>
          <SupabaseUrlHashHandler />
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
