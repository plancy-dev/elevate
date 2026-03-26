import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ElevateLogo } from "@/components/layout/elevate-logo";

export async function Footer() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const year = new Date().getFullYear();

  const footerColumns: { title: string; links: { href: string; label: string }[] }[] =
    [
      {
        title: t("product"),
        links: [
          {
            href: "/product/event-management",
            label: nav("productEventManagement"),
          },
          {
            href: "/product/attendee-engagement",
            label: nav("productAttendeeEngagement"),
          },
          { href: "/product/analytics", label: nav("productAnalytics") },
          { href: "/product/ai-concierge", label: nav("productAiConcierge") },
        ],
      },
      {
        title: t("solutions"),
        links: [
          { href: "/solutions/conferences", label: nav("solConferences") },
          { href: "/solutions/exhibitions", label: nav("solExhibitions") },
          {
            href: "/solutions/incentive-travel",
            label: nav("solIncentiveTravel"),
          },
          {
            href: "/solutions/corporate-meetings",
            label: nav("solCorporateMeetings"),
          },
        ],
      },
      {
        title: t("company"),
        links: [
          { href: "/about", label: t("about") },
          { href: "/careers", label: t("careers") },
          { href: "/blog", label: t("blog") },
          { href: "/contact", label: nav("contactSales") },
        ],
      },
      {
        title: t("legal"),
        links: [
          { href: "/terms", label: t("termsOfService") },
          { href: "/privacy", label: t("privacyPolicy") },
          { href: "/security", label: t("security") },
          { href: "/compliance", label: t("compliance") },
        ],
      },
    ];

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-[1584px] px-4 py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <ElevateLogo size="sm" />
            <p className="mt-4 text-xs text-text-tertiary leading-relaxed max-w-[220px]">
              {t("tagline")}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border-subtle pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-text-tertiary">
            {t("copyright", { year })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="text-xs text-text-tertiary">{t("badgeSoc2")}</span>
            <span className="text-xs text-text-tertiary">{t("badgeGdpr")}</span>
            <span className="text-xs text-text-tertiary">{t("badgeIso")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
