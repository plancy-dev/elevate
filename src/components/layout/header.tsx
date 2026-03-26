"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IntlButtonLink } from "@/components/layout/intl-button-link";
import { buttonLinkClassName } from "@/components/ui/button";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("Nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    {
      label: t("product"),
      href: "/product",
      children: [
        { href: "/product/event-management", label: t("productEventManagement") },
        { href: "/product/attendee-engagement", label: t("productAttendeeEngagement") },
        { href: "/product/analytics", label: t("productAnalytics") },
        { href: "/product/ai-concierge", label: t("productAiConcierge") },
      ],
    },
    {
      label: t("solutions"),
      href: "/solutions",
      children: [
        { href: "/solutions/conferences", label: t("solConferences") },
        { href: "/solutions/exhibitions", label: t("solExhibitions") },
        { href: "/solutions/incentive-travel", label: t("solIncentiveTravel") },
        { href: "/solutions/corporate-meetings", label: t("solCorporateMeetings") },
      ],
    },
    { label: t("pricing"), href: "/pricing" },
    { label: t("resources"), href: "/resources" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-[1584px] items-center justify-between gap-2 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ElevateLogo size="sm" />
          </Link>

          <nav className="hidden lg:flex items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 h-12 px-4 text-sm text-text-secondary transition-colors",
                  "hover:text-text-primary hover:bg-layer-02",
                )}
              >
                {link.label}
                {link.children && <ChevronDown className="h-3 w-3" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <IntlButtonLink href="/contact" variant="ghost" size="sm">
            {t("contactSales")}
          </IntlButtonLink>
          <NextLink
            href="/login"
            className={buttonLinkClassName("ghost", "sm")}
          >
            {t("logIn")}
          </NextLink>
          <IntlButtonLink href="/demo" variant="primary" size="sm">
            {t("requestDemo")}
          </IntlButtonLink>
        </div>

        <button
          type="button"
          className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center text-text-secondary hover:bg-layer-02"
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
        <div className="lg:hidden border-t border-border-subtle bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2">
            <LanguageSwitcher className="flex-1" />
            <ThemeToggle />
          </div>
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-layer-02"
                  onClick={() => !link.children && setMobileOpen(false)}
                >
                  {link.label}
                  {link.children && <ChevronDown className="h-3 w-3" />}
                </Link>
                {link.children && (
                  <div className="bg-layer-01">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-8 py-2.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-layer-02"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-border-subtle p-4 flex flex-col gap-2">
              <IntlButtonLink
                href="/contact"
                variant="ghost"
                size="md"
                className={cn("w-full")}
                onClick={() => setMobileOpen(false)}
              >
                {t("contactSales")}
              </IntlButtonLink>
              <NextLink
                href="/login"
                className={buttonLinkClassName("ghost", "md", "w-full")}
                onClick={() => setMobileOpen(false)}
              >
                {t("logIn")}
              </NextLink>
              <IntlButtonLink
                href="/demo"
                variant="primary"
                size="md"
                className={cn("w-full")}
                onClick={() => setMobileOpen(false)}
              >
                {t("requestDemo")}
              </IntlButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
