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
          "flex items-center gap-1 h-12 px-4 text-sm text-text-secondary transition-colors",
          "hover:text-text-primary hover:bg-layer-02",
          "data-[state=open]:text-text-primary data-[state=open]:bg-layer-02",
          "outline-none",
          className,
        )}
      >
        {label}
        <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[240px] z-[100] rounded-sm border border-border-subtle bg-surface py-1 shadow-md"
          sideOffset={4}
          align="start"
        >
          {items.map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="block px-4 py-2.5 text-sm text-text-secondary outline-none cursor-pointer hover:bg-layer-02 hover:text-text-primary"
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
