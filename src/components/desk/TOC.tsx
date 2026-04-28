"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useMessages } from "next-intl";
import { cn } from "@/lib/utils";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { DeskShellUser } from "@/components/desk/shell-user";
import { getNestedMessage } from "@/lib/i18n/safe-message";

type TocMode = "dashboard" | "admin";

type TocItem = {
  href: string;
  label: string;
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
          {
            href: "/dashboard/productions/projects",
            label: tx("studio.projects", "Projects"),
          },
          {
            href: "/dashboard/productions/integrations",
            label: tx("studio.integrations", "Integrations"),
          },
          {
            href: "/dashboard/productions/channels",
            label: tx("studio.channels", "Channels"),
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
          collapsed ? "lg:w-[48px]" : "lg:w-[240px]",
        )}
      >
        <div className="flex h-12 items-center border-b border-ink-100 px-3">
          {!collapsed ? (
            <Link href={mode === "admin" ? "/admin" : "/dashboard"} className="shrink-0">
              <ElevateLogo size="sm" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="font-mono text-xs uppercase tracking-[0.04em] text-ink-700"
              aria-label={tx("expand", "Expand")}
            >
              I
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className={cn("space-y-5", collapsed && "space-y-4 px-0")}>
            {sections.map((section) => {
              const sectionActive = section.items.some((item) => item.href === activeHref);
              if (collapsed) {
                return (
                  <button
                    key={section.numeral}
                    type="button"
                    onClick={toggleCollapsed}
                    className={cn(
                      "relative flex w-full justify-center py-3 [font-family:var(--font-display)] text-lg text-ink-700",
                      sectionActive && "text-ink-900",
                    )}
                    aria-label={section.ariaLabel}
                  >
                    {sectionActive ? (
                      <span className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 text-vermilion-600">
                        •
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
                      {section.ariaLabel.slice(0, 1)}
                    </span>
                  </button>
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
                              "relative block pl-4 text-[13px] uppercase tracking-[0.08em] text-ink-500 transition-colors duration-80 ease-(--ease-editorial)",
                              active && "font-medium text-ink-900",
                            )}
                          >
                            {active ? (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-vermilion-600">
                                •
                              </span>
                            ) : null}
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
          <div className="border-t border-ink-100 px-3 py-3">
            <div className="mb-2 text-xs text-ink-500">
              <p className="truncate font-medium text-ink-900">{user.displayName}</p>
              <p className="truncate">{user.email}</p>
              <p className="truncate">{user.orgName}</p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              data-shortcut="cmd+\\"
              className="mb-2 inline-flex border border-ink-300 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-700 hover:border-ink-900 hover:text-ink-900"
            >
              {tx("collapse", "Collapse")}
            </button>
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
