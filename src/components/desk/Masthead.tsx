import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type MastheadProps = {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function Masthead({ title, eyebrow, actions, meta, className }: MastheadProps) {
  return (
    <header className={cn("mb-8 border-b border-ink-100 pb-6", className)}>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[2.2rem] leading-[1.05] text-ink-900 [font-family:var(--font-display)] [font-variation-settings:'opsz'_144]">
            {title}
          </h1>
          {meta ? (
            <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
