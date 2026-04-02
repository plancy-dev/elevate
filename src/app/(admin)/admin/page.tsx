import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  CreditCard,
  FileText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.admin");
  return { title: t("metaTitle") };
}

export default async function AdminHomePage() {
  const t = await getTranslations("Dashboard.admin");

  const links = [
    {
      href: "/admin/content",
      title: t("cards.catalog.title"),
      desc: t("cards.catalog.desc"),
      icon: BookOpen,
    },
    {
      href: "/admin/audit",
      title: t("cards.audit.title"),
      desc: t("cards.audit.desc"),
      icon: FileText,
    },
    {
      href: "/dashboard/team",
      title: t("cards.team.title"),
      desc: t("cards.team.desc"),
      icon: Users,
    },
    {
      href: "/dashboard/billing",
      title: t("cards.billing.title"),
      desc: t("cards.billing.desc"),
      icon: CreditCard,
    },
    {
      href: "/dashboard/settings",
      title: t("cards.settings.title"),
      desc: t("cards.settings.desc"),
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-interactive hover:text-primary transition-colors"
        >
          {t("backToOverview")}
        </Link>
      </div>

      <div className="p-6 max-w-3xl space-y-6">
        <div className="text-sm text-text-secondary leading-relaxed">
          {t.rich("intro", {
            studio: (chunks) => (
              <Link
                href="/dashboard/studio"
                className="text-interactive hover:text-primary font-medium"
              >
                {chunks}
              </Link>
            ),
            library: (chunks) => (
              <Link
                href="/dashboard/library"
                className="text-interactive hover:text-primary font-medium"
              >
                {chunks}
              </Link>
            ),
          })}
        </div>

        <ul className="space-y-3">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex gap-4 rounded-sm border border-border-subtle bg-layer-01 p-4 transition-colors hover:bg-layer-02"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-highlight text-primary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {item.title}
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">{item.desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
