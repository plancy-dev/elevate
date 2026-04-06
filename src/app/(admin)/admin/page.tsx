import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ListChecks, Mail, Shield } from "lucide-react";
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
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-border-subtle bg-background px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
        </div>
      </div>

      <div className="p-6 max-w-3xl space-y-6">
        <p className="text-sm text-text-secondary leading-relaxed">{t("intro")}</p>

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
