"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Building2,
  CreditCard,
  Settings,
  HelpCircle,
  Shield,
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

export function Sidebar({
  user,
  showBilling = true,
  showAdminHub = false,
}: {
  user: SidebarUser;
  showBilling?: boolean;
  showAdminHub?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.sidebar");
  const tRoles = useTranslations("Dashboard.roles");

  const primaryNavItems = [
    { label: t("overview"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("library"), href: "/dashboard/library", icon: BookOpen },
    { label: t("promptStudio"), href: "/dashboard/studio", icon: Sparkles },
  ];

  const workspaceNavItems = [
    { label: t("team"), href: "/dashboard/team", icon: Building2 },
  ];

  const bottomItems = [
    ...(showBilling
      ? [{ label: t("billing"), href: "/dashboard/billing", icon: CreditCard }]
      : []),
    { label: t("settings"), href: "/dashboard/settings", icon: Settings },
    { label: t("helpSupport"), href: "/dashboard/help", icon: HelpCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border-subtle bg-layer-01">
      <div className="flex h-12 items-center justify-between gap-2 px-4 border-b border-border-subtle">
        <Link href="/dashboard">
          <ElevateLogo size="sm" />
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {primaryNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-highlight text-primary font-medium border-l-2 border-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-layer-02",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>

        {showAdminHub ? (
          <div className="mt-3 px-2">
            <Link
              href="/admin"
              title={t("adminServiceTitle")}
              aria-current={
                pathname === "/admin" || pathname.startsWith("/admin/")
                  ? "page"
                  : undefined
              }
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                pathname === "/admin" || pathname.startsWith("/admin/")
                  ? "bg-highlight text-primary font-medium border-l-2 border-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-layer-02 border-l-2 border-transparent",
              )}
            >
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              {t("adminService")}
            </Link>
          </div>
        ) : null}

        <div className="mt-4 px-3 pb-1 pt-2 border-t border-border-subtle">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            {t("workspace")}
          </p>
        </div>
        <div className="space-y-0.5">
          {workspaceNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-highlight text-primary font-medium border-l-2 border-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-layer-02",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border-subtle py-3 px-2 space-y-0.5">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-layer-02 transition-colors"
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        ))}
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
