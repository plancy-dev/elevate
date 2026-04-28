import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

type BadgeVariant =
  | "default"
  | "active"
  | "muted"
  | "blue"
  | "green"
  | "red"
  | "warm-gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "border border-ink-700 bg-paper-100 text-ink-900",
  active: "border border-vermilion-600 bg-vermilion-600 text-paper-50",
  muted: "border border-transparent bg-transparent text-ink-500",
  blue: "border border-ink-700 bg-paper-100 text-ink-900",
  green: "border border-ink-700 bg-paper-100 text-ink-900",
  red: "border border-vermilion-600 bg-vermilion-600 text-paper-50",
  "warm-gray": "border border-transparent bg-transparent text-ink-500",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.02em]",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
