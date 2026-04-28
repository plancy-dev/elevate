"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IntlButtonLink } from "@/components/layout/intl-button-link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { HeaderAuthCluster } from "@/components/layout/header-auth-cluster";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MarketingNavDropdown } from "@/components/layout/marketing-nav-dropdown";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useDashboardEntitlement } from "@/hooks/use-dashboard-entitlement";
import { cn } from "@/lib/utils";

type NavDropdownDef = {
  type: "dropdown";
  label: string;
  items: { href: string; label: string }[];
};

type NavLinkDef = {
  type: "link";
  label: string;
  href: string;
};

type NavEntry = NavDropdownDef | NavLinkDef;

export function Header() {
  const t = useTranslations("Nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const authUser = useAuthUser();
  const showDashboardLink = useDashboardEntitlement(authUser) === true;
  const showLeadGen = authUser === null;

  const navEntries: NavEntry[] = [
    {
      type: "dropdown",
      label: t("product"),
      items: [
        { href: "/product/prompt-studio", label: t("productPromptStudio") },
        { href: "/product/ebooks-and-guides", label: t("productEbooksAndGuides") },
      ],
    },
    { type: "link", label: t("blog"), href: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-marketing-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-marketing-canvas/75">
      <div className="mx-auto flex h-12 max-w-[1584px] items-center justify-between gap-2 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ElevateLogo size="sm" />
          </Link>

          <nav className="hidden lg:flex items-center">
            {navEntries.map((entry) =>
              entry.type === "link" ? (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cn(
                    "flex h-12 items-center px-4 text-sm text-ink-600 transition-colors duration-80 ease-(--ease-editorial)",
                    "hover:bg-paper-100 hover:text-ink-900",
                  )}
                >
                  {entry.label}
                </Link>
              ) : (
                <MarketingNavDropdown
                  key={entry.label}
                  label={entry.label}
                  items={entry.items}
                />
              ),
            )}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          {showLeadGen ? (
            <IntlButtonLink href="/#waitlist" variant="marketing" size="sm">
              {t("joinWaitlist")}
            </IntlButtonLink>
          ) : null}
          <IntlButtonLink href="/contact" variant="ghost" size="sm">
            {t("contactSales")}
          </IntlButtonLink>
          <HeaderAuthCluster
            user={authUser}
            showDashboardLink={showDashboardLink}
          />
        </div>

        <button
          type="button"
          className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center text-ink-600 hover:bg-paper-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-marketing-canvas lg:hidden">
          <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-2">
            <LanguageSwitcher className="flex-1" />
            <ThemeToggle />
          </div>
          <nav className="flex flex-col">
            {navEntries.map((entry) =>
              entry.type === "link" ? (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="px-4 py-3 text-sm text-ink-600 hover:bg-paper-100 hover:text-ink-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {entry.label}
                </Link>
              ) : (
                <div key={entry.label} className="border-b border-ink-100">
                  <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                    {entry.label}
                  </div>
                  <div className="bg-paper-100">
                    {entry.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-6 py-2.5 text-sm text-ink-600 hover:bg-paper-50 hover:text-ink-900"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            )}
            <div className="flex flex-col gap-2 border-t border-ink-100 p-4">
              {showLeadGen ? (
                <IntlButtonLink
                  href="/#waitlist"
                  variant="marketing"
                  size="md"
                  className="w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("joinWaitlist")}
                </IntlButtonLink>
              ) : null}
              <IntlButtonLink
                href="/contact"
                variant="ghost"
                size="md"
                className={cn("w-full")}
                onClick={() => setMobileOpen(false)}
              >
                {t("contactSales")}
              </IntlButtonLink>
              <HeaderAuthCluster
                user={authUser}
                showDashboardLink={showDashboardLink}
                size="md"
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
