"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type MarketingNavDropdownItem = { href: string; label: string };

type Props = {
  label: string;
  items: MarketingNavDropdownItem[];
  className?: string;
};

export function MarketingNavDropdown({ label, items, className }: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        type="button"
        className={cn(
          "flex h-12 items-center gap-1 px-4 text-sm text-ink-600 transition-colors duration-80 ease-(--ease-editorial)",
          "hover:bg-paper-100 hover:text-ink-900",
          "data-[state=open]:bg-paper-100 data-[state=open]:text-ink-900",
          "outline-none",
          className,
        )}
      >
        {label}
        <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[100] min-w-[240px] border border-ink-100 bg-paper-100 py-1"
          sideOffset={4}
          align="start"
        >
          {items.map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="block cursor-pointer px-4 py-2.5 text-sm text-ink-600 outline-none transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-50 hover:text-ink-900"
              >
                {item.label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
