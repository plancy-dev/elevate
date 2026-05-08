"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ContentQueueTooltipProvider({ children }: { children: ReactNode }) {
  return <Tooltip.Provider delayDuration={280} skipDelayDuration={200}>{children}</Tooltip.Provider>;
}

export function ContentQueueIconTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className={cn(
            "z-90 max-w-[16rem] rounded border border-ink-200 bg-paper-0 px-2 py-1.5 text-[11px] leading-snug text-ink-900 shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          {label}
          <Tooltip.Arrow className="fill-paper-0" width={10} height={5} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
