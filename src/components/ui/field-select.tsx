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
  id,
  ...props
}: FieldSelectProps) {
  const height = controlSize === "sm" ? "h-9" : "h-10";
  const grouped = optionGroups != null && optionGroups.length > 0;

  return (
    <div className={cn("relative w-full min-w-0")}>
      <select
        id={id}
        className={cn(
          height,
          "w-full min-w-0 appearance-none rounded-lg border border-border-subtle bg-field",
          "pl-3 pr-10",
          "text-sm",
          "text-text-primary",
          "cursor-pointer shadow-none outline-none transition-colors",
          "hover:border-border-subtle focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
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
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md bg-field/90 text-text-tertiary"
        aria-hidden
      >
        <ChevronDown className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} />
      </span>
    </div>
  );
}
