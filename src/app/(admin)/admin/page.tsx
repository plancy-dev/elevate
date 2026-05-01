import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  BookOpen,
  Cable,
  ListChecks,
  Mail,
  Newspaper,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminElevate");
  return { title: t("metaTitle") };
}

export default async function ElevateServiceAdminHomePage() {
  const t = await getTranslations("Dashboard.adminElevate");

  const links = [
    {
      href: "/admin/content",
      title: t("cards.catalog.title"),
      desc: t("cards.catalog.desc"),
      icon: BookOpen,
    },
    {
      href: "/admin/lemon-webhook",
      title: t("cards.lemonWebhook.title"),
      desc: t("cards.lemonWebhook.desc"),
      icon: Cable,
    },
    {
      href: "/admin/waitlist",
      title: t("cards.waitlist.title"),
      desc: t("cards.waitlist.desc"),
      icon: Mail,
    },
    {
      href: "/admin/purchase-allowlist",
      title: t("cards.purchaseAllowlist.title"),
      desc: t("cards.purchaseAllowlist.desc"),
      icon: ListChecks,
    },
    {
      href: "/admin/content-queue",
      title: "Content queue",
      desc: "Review, approve, schedule, and publish blog/newsletter drafts.",
      icon: ListChecks,
    },
    {
      href: "/admin/news-sources",
      title: "News sources",
      desc: "Manage RSS/blog sources and trust weights for ingestion.",
      icon: Newspaper,
    },
    {
      href: "/admin/runs",
      title: "Automation runs",
      desc: "Inspect run logs and queue manual ingest/generate/publish runs.",
      icon: Activity,
    },
    {
      href: "/admin/content-quality",
      title: "Content quality monitor",
      desc: "Track quality signals, failure trends, and improvement focus in one place.",
      icon: Sparkles,
    },
    {
      href: "/admin/subscribers",
      title: "Subscribers",
      desc: "Operate newsletter subscriber lifecycle separately from waitlist.",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          <h1 className="text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
      </div>

      <div className="p-6 max-w-3xl space-y-6">
        <p className="text-sm text-ink-700 leading-relaxed">{t("intro")}</p>

        <ul className="space-y-3">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex gap-4 border border-ink-100 bg-paper-100 p-4 transition-colors hover:bg-paper-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-highlight text-primary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-900">
                    {item.title}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{item.desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
