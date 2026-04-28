"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMessages } from "next-intl";
import { TOC, getInitialCollapsed } from "@/components/desk/TOC";
import {
  CommandBar,
  type CommandBarRecentEpisode,
} from "@/components/desk/CommandBar";
import { Masthead } from "@/components/desk/Masthead";
import type { DeskShellUser } from "@/components/desk/shell-user";
import { useShortcut } from "@/hooks/use-shortcut";
import { getNestedMessage } from "@/lib/i18n/safe-message";

type DeskShellProps = {
  mode: "dashboard" | "admin";
  user: DeskShellUser;
  isOrgAdmin: boolean;
  isServiceAdmin: boolean;
  recentEpisodes: CommandBarRecentEpisode[];
  children: React.ReactNode;
};

export function DeskShell({
  mode,
  user,
  isOrgAdmin,
  isServiceAdmin,
  recentEpisodes,
  children,
}: DeskShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messages = useMessages();
  const tx = useCallback(
    (key: string, fallback: string) =>
      getNestedMessage(messages, `Dashboard.shellTitles.${key}`) ?? fallback,
    [messages],
  );
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    getInitialCollapsed(searchParams.get("toc")),
  );
  const [commandOpen, setCommandOpen] = useState(false);

  const title = useMemo(() => {
    if (mode === "admin") return tx("admin", "Admin");
    if (pathname.startsWith("/dashboard/productions")) return tx("productions", "Productions");
    if (pathname.startsWith("/dashboard/studio")) return tx("studio", "Prompt Studio");
    if (pathname.startsWith("/dashboard/library")) return tx("library", "Library");
    if (pathname.startsWith("/dashboard/settings")) return tx("settings", "Settings");
    if (pathname.startsWith("/dashboard/help")) return tx("help", "Help & Support");
    if (pathname.startsWith("/dashboard/billing")) return tx("billing", "Billing");
    if (pathname.startsWith("/dashboard/team")) return tx("team", "Team");
    if (pathname.startsWith("/dashboard/organization")) return tx("organization", "Organization");
    if (pathname.startsWith("/dashboard/admin")) return tx("admin", "Admin");
    return tx("overview", "Overview");
  }, [mode, pathname, tx]);

  useShortcut({
    onOpenCommandBar: () => setCommandOpen(true),
    onToggleToc: () => setCollapsed((prev) => !prev),
    onSequenceNavigate: (seq) => {
      if (mode === "admin") return;
      if (seq === "s") router.push("/dashboard/studio");
      if (seq === "t") router.push("/dashboard/productions");
      if (seq === "p") router.push("/dashboard/productions");
    },
  });

  return (
    <div className="min-h-screen bg-paper-50">
      <TOC
        mode={mode}
        user={user}
        isOrgAdmin={isOrgAdmin}
        isServiceAdmin={isServiceAdmin}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      />

      <div className={collapsed ? "lg:ml-[48px]" : "lg:ml-[240px]"}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Masthead title={title} eyebrow={mode === "admin" ? "House" : "Desk"} />
          {children}
        </div>
      </div>

      <CommandBar
        mode={mode}
        open={commandOpen}
        onOpenChange={setCommandOpen}
        recentEpisodes={recentEpisodes}
      />
    </div>
  );
}
