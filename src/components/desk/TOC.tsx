"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useMessages } from "next-intl";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  CreditCard,
  Shield,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { DeskShellUser } from "@/components/desk/shell-user";
import { getNestedMessage } from "@/lib/i18n/safe-message";

type TocMode = "dashboard" | "admin";
export type SidebarIconTonePreset = "calm" | "focus";

type TocItem = {
  href: string;
  label: string;
};

type CollapsedNavItem = TocItem & {
  icon: LucideIcon;
};

type TocSection = {
  numeral: string;
  ariaLabel: string;
  items: TocItem[];
};

type TOCProps = {
  mode: TocMode;
  user: DeskShellUser;
  isOrgAdmin: boolean;
  isServiceAdmin: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  iconTonePreset?: SidebarIconTonePreset;
};

function findActiveHref(pathname: string, sections: TocSection[]): string | null {
  let best: { href: string; score: number } | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.href) return item.href;
      if (pathname.startsWith(`${item.href}/`)) {
        const score = item.href.length;
        if (!best || score > best.score) best = { href: item.href, score };
      }
    }
  }
  return best?.href ?? null;
}

export function TOC({
  mode,
  user,
  isOrgAdmin,
  isServiceAdmin,
  collapsed,
  onToggleCollapsed,
  iconTonePreset = "focus",
}: TOCProps) {
  const messages = useMessages();
  const tx = useCallback(
    (key: string, fallback: string) =>
      getNestedMessage(messages, `Dashboard.toc.${key}`) ?? fallback,
    [messages],
  );
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(null);

  const sections = useMemo<TocSection[]>(() => {
    if (mode === "admin") {
      return [
        {
          numeral: "IV.",
          ariaLabel: tx("house.section", "House"),
          items: [
            { href: "/admin", label: tx("house.admin", "Admin") },
            { href: "/admin/content", label: tx("admin.content", "Content") },
            { href: "/admin/waitlist", label: tx("admin.waitlist", "Waitlist") },
            {
              href: "/admin/purchase-allowlist",
              label: tx("admin.purchaseAllowlist", "Checkout allowlist"),
            },
            {
              href: "/admin/prompt-studio-allowlist",
              label: tx("admin.promptStudioAllowlist", "Prompt Studio beta"),
            },
          ],
        },
      ];
    }

    const houseItems: TocItem[] = [
      { href: "/dashboard/team", label: tx("house.team", "Team") },
    ];
    if (isOrgAdmin) {
      houseItems.push({
        href: "/dashboard/organization/audit",
        label: tx("house.audit", "Audit"),
      });
    }
    if (isServiceAdmin) {
      houseItems.push({
        href: "/dashboard/admin",
        label: tx("house.admin", "Admin"),
      });
    }

    return [
      {
        numeral: "I.",
        ariaLabel: tx("studio.section", "Studio"),
        items: [
          {
            href: "/dashboard/productions",
            label: tx("studio.productions", "Productions"),
          },
        ],
      },
      {
        numeral: "II.",
        ariaLabel: tx("scripts.section", "Scripts"),
        items: [
          {
            href: "/dashboard/studio",
            label: tx("scripts.promptStudio", "Prompt Studio"),
          },
        ],
      },
      {
        numeral: "III.",
        ariaLabel: tx("library.section", "Library"),
        items: [{ href: "/dashboard/library", label: tx("library.library", "Library") }],
      },
      { numeral: "IV.", ariaLabel: tx("house.section", "House"), items: houseItems },
      {
        numeral: "V.",
        ariaLabel: tx("settings.section", "Settings"),
        items: [
          { href: "/dashboard/settings", label: tx("settings.profile", "Profile") },
          { href: "/dashboard/billing", label: tx("settings.billing", "Billing") },
          { href: "/dashboard/help", label: tx("settings.help", "Help") },
        ],
      },
    ];
  }, [isOrgAdmin, isServiceAdmin, mode, tx]);

  const activeHref = findActiveHref(pathname, sections);
  const iconTone = useMemo(
    () =>
      iconTonePreset === "calm"
        ? {
            base:
              "border border-transparent bg-transparent text-ink-500 hover:border-ink-200 hover:bg-paper-0 hover:text-ink-900",
            active:
              "border-ink-300 bg-paper-0 text-ink-900 shadow-[inset_0_0_0_1px_var(--ink-100)]",
            indicator: "bg-ink-500",
          }
        : {
            base:
              "border border-transparent bg-transparent text-ink-500 hover:border-ink-200 hover:bg-paper-0 hover:text-ink-900",
            active:
              "border-vermilion-100 bg-vermilion-100/35 text-vermilion-600 shadow-[inset_0_0_0_1px_var(--vermilion-100)]",
            indicator: "bg-vermilion-600",
          },
    [iconTonePreset],
  );
  const collapsedNavItems = useMemo<CollapsedNavItem[]>(() => {
    const iconByHref: Record<string, LucideIcon> = {
      "/dashboard/productions": Clapperboard,
      "/dashboard/studio": Sparkles,
      "/dashboard/library": BookOpen,
      "/dashboard/team": Users,
      "/dashboard/organization/audit": Shield,
      "/dashboard/admin": Shield,
      "/dashboard/settings": UserRound,
      "/dashboard/billing": CreditCard,
      "/dashboard/help": CircleHelp,
      "/admin": Shield,
      "/admin/content": BookOpen,
      "/admin/waitlist": Users,
      "/admin/purchase-allowlist": Shield,
      "/admin/prompt-studio-allowlist": Sparkles,
    };

    const items = sections.flatMap((section) => section.items);
    return items.map((item) => ({
      ...item,
      icon: iconByHref[item.href] ?? BookOpen,
    }));
  }, [sections]);
  const syncCollapsedToQuery = (nextCollapsed: boolean) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextCollapsed) next.set("toc", "collapsed");
    else next.delete("toc");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    syncCollapsedToQuery(next);
    onToggleCollapsed();
  };

  return (
    <>
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col lg:border-r lg:border-ink-100 lg:bg-paper-100",
          collapsed ? "lg:w-[68px]" : "lg:w-[240px]",
        )}
      >
        <div className="flex h-12 items-center justify-between border-b border-ink-100 px-3">
          {!collapsed ? (
            <Link href={mode === "admin" ? "/admin" : "/dashboard"} className="shrink-0">
              <ElevateLogo size="sm" />
            </Link>
          ) : (
            <Link href={mode === "admin" ? "/admin" : "/dashboard"} className="mx-auto">
              <span className="sr-only">Elevate</span>
              <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-0/90 p-1.5">
                <ElevateLogo size="sm" showText={false} />
              </div>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-1)] border border-transparent bg-transparent text-ink-500 transition-all duration-100 ease-(--ease-editorial) hover:border-ink-200 hover:bg-paper-0 hover:text-ink-900",
              collapsed &&
                "mx-auto transition-[opacity,color,background-color,border-color] duration-120 ease-(--ease-editorial) opacity-80 hover:opacity-100",
            )}
            aria-label={collapsed ? tx("expand", "Expand") : tx("collapse", "Collapse")}
            title={collapsed ? tx("expand", "Expand") : tx("collapse", "Collapse")}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={cn("flex-1 overflow-y-auto p-3", collapsed && "px-2.5 pb-4 pt-3")}>
          <div className={cn("space-y-5", collapsed && "space-y-3 px-0")}>
            {sections.map((section) => {
              if (collapsed) {
                return (
                  <section key={section.numeral} aria-label={section.ariaLabel}>
                    <ul className="space-y-2">
                      {section.items.map((item) => {
                        const active = item.href === activeHref;
                        const collapsedItem = collapsedNavItems.find(
                          (collapsedNavItem) => collapsedNavItem.href === item.href,
                        );
                        const Icon = collapsedItem?.icon ?? BookOpen;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-label={item.label}
                              title={item.label}
                              className={cn(
                                "group relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-1)] transition-[opacity,color,background-color,border-color] duration-120 ease-(--ease-editorial) opacity-80 hover:opacity-100",
                                iconTone.base,
                                active && cn(iconTone.active, "opacity-100"),
                              )}
                            >
                              {active ? (
                                <span
                                  className={cn(
                                    "absolute -left-1.5 top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-full",
                                    iconTone.indicator,
                                  )}
                                  aria-hidden
                                />
                              ) : null}
                              <Icon size={16} strokeWidth={2} />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              }

              return (
                <section key={section.numeral} aria-label={section.ariaLabel}>
                  <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                    {section.ariaLabel}
                  </h2>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const active = item.href === activeHref;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "relative block rounded-[var(--radius-1)] px-3 py-1.5 text-[13px] uppercase tracking-[0.08em] text-ink-500 transition-all duration-100 ease-(--ease-editorial) hover:bg-paper-0 hover:text-ink-900",
                              active &&
                                "border border-ink-100 bg-paper-0 font-medium text-ink-900 shadow-[inset_2px_0_0_var(--vermilion-600)]",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </nav>

        {!collapsed ? (
          <div className="border-t border-ink-100 px-3 py-4">
            <div className="mb-3 space-y-1 text-[11px] leading-4 text-ink-500">
              <p className="truncate font-medium text-ink-900">{user.displayName}</p>
              <p className="truncate">{user.email}</p>
              <p className="truncate">{user.orgName}</p>
            </div>
            <SignOutButton />
          </div>
        ) : null}
      </aside>

      <div className="sticky top-0 z-40 border-b border-ink-100 bg-paper-50 lg:hidden">
        <div className="flex h-14 items-center gap-2 overflow-x-auto px-3">
          {sections.map((section) => {
            const active = section.items.some((item) => item.href === activeHref);
            return (
              <button
                key={section.numeral}
                type="button"
                onClick={() => setMobileOpenSection(section.numeral)}
                className={cn(
                  "relative whitespace-nowrap px-2 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-700",
                  active && "text-ink-900",
                )}
              >
                {section.ariaLabel}
                {active ? (
                  <span className="absolute inset-x-1 -bottom-1 h-[2px] bg-vermilion-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog.Root
        open={mobileOpenSection !== null}
        onOpenChange={(next) => {
          if (!next) setMobileOpenSection(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-70 bg-ink-900/30 lg:hidden" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-70 border-t border-ink-700 bg-paper-50 p-4 lg:hidden">
            <Dialog.Title className="sr-only">
              {tx("mobile.menuTitle", "Navigation menu")}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {tx("mobile.menuDescription", "Choose a section to navigate.")}
            </Dialog.Description>
            <ul className="space-y-2">
              {(sections.find((section) => section.numeral === mobileOpenSection)?.items ?? []).map(
                (item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpenSection(null)}
                      className={cn(
                        "block border border-ink-100 bg-paper-0 px-3 py-2 text-sm text-ink-700",
                        item.href === activeHref && "border-vermilion-600 text-ink-900",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export function getInitialCollapsed(searchValue: string | null) {
  return searchValue === "collapsed";
}
