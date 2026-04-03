"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import type { SidebarUser } from "@/components/dashboard/sidebar";

export function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.adminShell");
  const tSide = useTranslations("Dashboard.sidebar");
  const tRoles = useTranslations("Dashboard.roles");

  const primaryNavItems = [
    { label: t("navOverview"), href: "/admin", icon: LayoutDashboard },
    { label: t("navContent"), href: "/admin/content", icon: BookOpen },
    { label: t("navPurchaseAllowlist"), href: "/admin/purchase-allowlist", icon: ListChecks },
    { label: t("navAudit"), href: "/admin/audit", icon: FileText },
  ];

  const orgNavItems = [
    { label: tSide("team"), href: "/dashboard/team", icon: Users },
    { label: tSide("billing"), href: "/dashboard/billing", icon: CreditCard },
    { label: tSide("settings"), href: "/dashboard/settings", icon: Settings },
    { label: tSide("helpSupport"), href: "/dashboard/help", icon: HelpCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border-subtle bg-layer-01">
      <div className="flex h-12 items-center justify-between gap-2 px-4 border-b border-border-subtle">
        <Link href="/admin" aria-label={t("logoAria")}>
          <ElevateLogo size="sm" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t("administrator")}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-text-tertiary">
          {t("description")}
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-interactive hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("backToProduct")}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {primaryNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
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

        <div className="mt-4 px-3 pb-1 pt-2 border-t border-border-subtle">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            {t("sectionOrg")}
          </p>
        </div>
        <div className="space-y-0.5">
          {orgNavItems.map((item) => {
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
