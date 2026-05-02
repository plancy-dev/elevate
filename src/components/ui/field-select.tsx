"use client";

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; disabled?: boolean };

export type FieldSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  /** Flat list (default). Ignored when `optionGroups` is non-empty. */
  options?: Option[];
  /** Grouped `<optgroup>` rows — use for long model lists (tier, locale, etc.). */
  optionGroups?: { label: string; options: Option[] }[];
  /** Visually match dashboard text inputs (h-10, text-sm). */
  controlSize?: "md" | "sm";
  /** Visual style preset for different surfaces. */
  variant?: "underlined" | "boxed";
};

/**
 * Native `<select>` with an inset chevron (avoids the browser default arrow pinned to the far edge).
 * Use with server actions via `name` + `defaultValue`.
 */
export function FieldSelect({
  className,
  options = [],
  optionGroups,
  controlSize = "md",
  variant = "underlined",
  id,
  ...props
}: FieldSelectProps) {
  const height = controlSize === "sm" ? "h-9" : "h-10";
  const isBoxed = variant === "boxed";
  const grouped = optionGroups != null && optionGroups.length > 0;

  return (
    <div className={cn("relative w-full min-w-0")}>
      <select
        id={id}
        className={cn(
          height,
          "w-full min-w-0 appearance-none",
          isBoxed
            ? "border border-ink-100 bg-paper-50 px-2.5 text-xs text-ink-900"
            : "border-b border-ink-300 bg-transparent pl-0 text-sm text-ink-900",
          "pr-8",
          "cursor-pointer outline-none transition-[border-color,border-width] duration-[80ms] [transition-timing-function:var(--ease-editorial)]",
          isBoxed
            ? "focus-visible:border-vermilion-600"
            : "focus-visible:border-b-2 focus-visible:border-vermilion-600",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      >
        {grouped
          ? optionGroups!.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
      </select>
      <span
        className="pointer-events-none absolute right-2 top-1/2 z-[1] -translate-y-1/2 flex h-4 w-4 items-center justify-center text-ink-500"
        aria-hidden
      >
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} />
      </span>
    </div>
  );
}
