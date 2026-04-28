"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ShortcutBadge } from "@/components/desk/ShortcutBadge";
import { cn } from "@/lib/utils";
import { useMessages } from "next-intl";
import { getNestedMessage } from "@/lib/i18n/safe-message";

export type CommandBarRecentEpisode = {
  id: string;
  title: string;
};

type CommandBarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentEpisodes: CommandBarRecentEpisode[];
  mode: "dashboard" | "admin";
};

type CommandItem = {
  id: string;
  label: string;
  href: string;
  shortcut?: ReadonlyArray<string>;
  index: string;
};

export function CommandBar({
  open,
  onOpenChange,
  recentEpisodes,
  mode,
}: CommandBarProps) {
  const messages = useMessages();
  const tx = useCallback(
    (key: string, fallback: string) =>
      getNestedMessage(messages, `Dashboard.commandBar.${key}`) ?? fallback,
    [messages],
  );
  const router = useRouter();
  const [query, setQuery] = useState("");

  const routeItems = useMemo<CommandItem[]>(() => {
    if (mode === "admin") {
      return [
        {
          id: "admin-overview",
          label: tx("routes.overview", "Overview"),
          href: "/admin",
          index: "01",
        },
        {
          id: "admin-content",
          label: tx("routes.content", "Content"),
          href: "/admin/content",
          index: "02",
        },
        {
          id: "admin-waitlist",
          label: tx("routes.waitlist", "Waitlist"),
          href: "/admin/waitlist",
          index: "03",
        },
      ];
    }
    return [
      {
        id: "productions",
        label: tx("routes.productions", "Productions"),
        href: "/dashboard/productions",
        shortcut: ["G", "T"],
        index: "01",
      },
      {
        id: "studio",
        label: tx("routes.promptStudio", "Prompt Studio"),
        href: "/dashboard/studio",
        shortcut: ["G", "S"],
        index: "02",
      },
      {
        id: "publish",
        label: tx("routes.publish", "Publish"),
        href: "/dashboard/productions/channels",
        shortcut: ["G", "P"],
        index: "03",
      },
      {
        id: "library",
        label: tx("routes.library", "Library"),
        href: "/dashboard/library",
        index: "04",
      },
      {
        id: "settings",
        label: tx("routes.settings", "Settings"),
        href: "/dashboard/settings",
        index: "05",
      },
    ];
  }, [mode, tx]);

  const helpItems = useMemo<CommandItem[]>(() => {
    if (mode === "admin") {
      return [{ id: "admin-help", label: tx("help.admin", "Admin Home"), href: "/admin", index: "01" }];
    }
    return [
      {
        id: "help",
        label: tx("help.default", "Help & Support"),
        href: "/dashboard/help",
        index: "01",
      },
    ];
  }, [mode, tx]);

  const episodeItems = useMemo<CommandItem[]>(
    () =>
      recentEpisodes.map((episode, idx) => ({
        id: `episode-${episode.id}`,
        label: episode.title,
        href: `/dashboard/productions/${episode.id}`,
        index: String(idx + 1).padStart(2, "0"),
      })),
    [recentEpisodes],
  );

  const onSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-90 bg-ink-900/35" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-90 max-h-[50vh] border-t border-ink-700 bg-paper-50 p-3 outline-none">
          <Command className="mx-auto flex w-full max-w-5xl flex-col-reverse gap-3">
            <div className="max-h-[38vh] overflow-y-auto border border-ink-100 bg-paper-0">
              <Command.List>
                <Command.Empty className="px-3 py-4 font-mono text-xs uppercase tracking-[0.04em] text-ink-500">
                  {tx("empty", "No results")}
                </Command.Empty>

                <Command.Group
                  heading={tx("group.help", "Help")}
                  className="border-b border-ink-100"
                >
                  {helpItems.map((item) => (
                    <CommandBarRow key={item.id} item={item} onSelect={onSelect} />
                  ))}
                </Command.Group>

                <Command.Group
                  heading={tx("group.recentEpisodes", "Recent episodes")}
                  className="border-b border-ink-100"
                >
                  {episodeItems.length === 0 ? (
                    <div className="px-3 py-2 font-mono text-xs uppercase tracking-[0.04em] text-ink-500">
                      {tx("recentEmpty", "No recent episodes")}
                    </div>
                  ) : (
                    episodeItems.map((item) => (
                      <CommandBarRow key={item.id} item={item} onSelect={onSelect} />
                    ))
                  )}
                </Command.Group>

                <Command.Group heading={tx("group.routes", "Routes")}>
                  {routeItems.map((item) => (
                    <CommandBarRow key={item.id} item={item} onSelect={onSelect} />
                  ))}
                </Command.Group>
              </Command.List>
            </div>
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={tx("placeholder", "Type a command or route...")}
              className="h-11 w-full border border-ink-700 bg-paper-100 px-3 text-sm text-ink-900 placeholder:text-ink-500 outline-none"
            />
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CommandBarRow({
  item,
  onSelect,
}: {
  item: CommandItem;
  onSelect: (href: string) => void;
}) {
  return (
    <Command.Item
      value={item.label}
      onSelect={() => onSelect(item.href)}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 border-t border-ink-100 px-3 py-2 font-mono text-[12px] text-ink-700",
        "data-[selected=true]:bg-paper-100 data-[selected=true]:text-ink-900",
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <span className="text-ink-500">{item.index}</span>
        <span className="truncate">{item.label}</span>
      </span>
      {item.shortcut?.length ? (
        <ShortcutBadge keys={item.shortcut} density="inline" />
      ) : null}
    </Command.Item>
  );
}
