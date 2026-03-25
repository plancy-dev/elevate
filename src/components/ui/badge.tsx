import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "blue" | "green" | "red" | "warm-gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-03 text-text-secondary",
  blue: "bg-[#0043CE]/20 text-info",
  green: "bg-[#198038]/20 text-accent",
  red: "bg-[#DA1E28]/20 text-danger",
  "warm-gray": "bg-[#393939] text-text-secondary",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 text-xs font-medium",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
