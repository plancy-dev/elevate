"use client";

import type { LucideIcon } from "lucide-react";
import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  BookOpen,
  Clapperboard,
  Sparkles,
  CreditCard,
  Settings,
  HelpCircle,
  FileText,
  Users,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import type { OrgRoleKey } from "@/lib/user-roles";

export type SidebarUser = {
  displayName: string;
  email: string;
  /** `profiles.role` normalized for `Dashboard.roles.*` */
  role: OrgRoleKey;
  orgName: string;
  initials: string;
};

type BottomNavItem = {
  href: string;
  label: string;
  icon: typeof CreditCard;
};

function isBottomNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

/**
 * App nav: short rounded **marker** (not full-height rail / not generic pill wash).
 * See docs/design/DASHBOARD_UX_PRINCIPLES.md
 */
const sidebarNavLinkBase =
  "relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/35 focus-visible:ring-offset-2 focus-visible:ring-offset-layer-01";
const sidebarNavActive =
  "bg-layer-02 font-medium text-text-primary [&>svg]:text-primary";
const sidebarNavInactive =
  "text-text-secondary hover:bg-layer-02 hover:text-text-primary";
/** Softer label for footer links (billing, help) when idle */
const sidebarNavInactiveQuiet =
  "text-text-tertiary hover:bg-layer-02 hover:text-text-primary";

function isOrgNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/organization/audit") {
    return (
      pathname === href || pathname.startsWith("/dashboard/organization/audit/")
    );
  }
  if (href === "/dashboard/team") {
    return pathname === href || pathname.startsWith("/dashboard/team/");
  }
  if (href === "/dashboard/billing") {
    return pathname === href || pathname.startsWith("/dashboard/billing/");
  }
  if (href === "/dashboard/settings") {
    return pathname === href || pathname.startsWith("/dashboard/settings/");
  }
  return false;
}

type OrgNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Sidebar only — page remains reachable by URL */
  disabled?: boolean;
};

export function Sidebar({
  user,
  showBilling = true,
  showOrganizationHub = false,
}: {
  user: SidebarUser;
  showBilling?: boolean;
  showOrganizationHub?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.sidebar");
  const tRoles = useTranslations("Dashboard.roles");

  /** Non–org-admins use bottom billing/settings; org admins use the Organization section only. */
  const showBottomBillingSettings = showBilling && !showOrganizationHub;

  const primaryNavItems = [
    { label: t("overview"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("library"), href: "/dashboard/library", icon: BookOpen },
    { label: t("productions"), href: "/dashboard/productions", icon: Clapperboard },
    { label: t("promptStudio"), href: "/dashboard/studio", icon: Sparkles },
  ];

  const organizationNavItems: OrgNavItem[] = showOrganizationHub
    ? [
        {
          label: t("orgAudit"),
          href: "/dashboard/organization/audit",
          icon: FileText,
        },
        {
          label: t("orgTeam"),
          href: "/dashboard/team",
          icon: Users,
        },
        {
          label: t("orgBilling"),
          href: "/dashboard/billing",
          icon: CreditCard,
        },
        {
          label: t("orgSettings"),
          href: "/dashboard/settings",
          icon: Settings,
        },
      ]
    : [];

  const bottomItems: BottomNavItem[] = [
    ...(showBottomBillingSettings
      ? [{ label: t("billing"), href: "/dashboard/billing", icon: CreditCard }]
      : []),
    ...(showBottomBillingSettings
      ? [{ label: t("settings"), href: "/dashboard/settings", icon: Settings }]
      : []),
    { label: t("helpSupport"), href: "/dashboard/help", icon: HelpCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border-subtle bg-layer-01">
      <div className="flex h-12 items-center justify-between gap-2 border-b border-border-subtle px-4">
        <DashboardNavLink
          href="/dashboard"
          layout="inline"
          className="shrink-0 p-0"
        >
          <ElevateLogo size="sm" />
        </DashboardNavLink>
        <ThemeToggle />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {primaryNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <DashboardNavLink
                key={item.href}
                href={item.href}
                className={cn(
                  sidebarNavLinkBase,
                  isActive ? sidebarNavActive : sidebarNavInactive,
                )}
              >
                {isActive ? (
                  <span
                    className="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </DashboardNavLink>
            );
          })}
        </div>

        {organizationNavItems.length > 0 ? (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              {t("organizationSection")}
            </p>
            <div className="space-y-1">
              {organizationNavItems.map((item) => {
                const isDisabled = Boolean(item.disabled);
                const active =
                  !isDisabled && isOrgNavItemActive(pathname, item.href);
                const onDisabledRoute =
                  isDisabled && isOrgNavItemActive(pathname, item.href);

                if (isDisabled) {
                  return (
                    <span
                      key={item.href}
                      title={t("orgNavComingSoon")}
                      aria-disabled="true"
                      aria-current={onDisabledRoute ? "page" : undefined}
                      className={cn(
                        "flex select-none items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        "cursor-not-allowed text-text-tertiary opacity-55",
                        onDisabledRoute && "opacity-70",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </span>
                  );
                }

                return (
                  <DashboardNavLink
                    key={item.href}
                    href={item.href}
                    className={cn(
                      sidebarNavLinkBase,
                      active ? sidebarNavActive : sidebarNavInactive,
                    )}
                  >
                    {active ? (
                      <span
                        className="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
                        aria-hidden
                      />
                    ) : null}
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </DashboardNavLink>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="space-y-1 border-t border-border-subtle px-2 py-3">
        {bottomItems.map((item) => {
          const active = isBottomNavActive(pathname, item.href);
          return (
            <DashboardNavLink
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                sidebarNavLinkBase,
                active ? sidebarNavActive : sidebarNavInactiveQuiet,
              )}
            >
              {active ? (
                <span
                  className="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </DashboardNavLink>
          );
        })}
      </div>

      <div className="border-t border-border-subtle p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-03">
            <span className="text-xs font-medium text-text-secondary">
              {user.initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">
              {user.displayName}
            </div>
            <div className="text-xs text-text-tertiary truncate" title={user.email}>
              {user.email}
            </div>
            <div className="text-xs text-text-tertiary truncate">
              {tRoles(user.role)} · {user.orgName}
            </div>
          </div>
          <div className="shrink-0">
            <SignOutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
