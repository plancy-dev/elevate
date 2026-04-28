import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "danger"
  /** @deprecated Use `primary` in Editor's Desk v3. */
  | "marketing";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border-ink-900 bg-vermilion-600 text-paper-50 hover:ring-1 hover:ring-inset hover:ring-ink-900",
  secondary: "border-ink-900 bg-paper-0 text-ink-900 hover:bg-paper-50",
  tertiary:
    "border-ink-300 bg-paper-0 text-ink-700 hover:border-ink-900 hover:text-ink-900",
  ghost:
    "border-transparent bg-transparent text-ink-900 hover:border-b hover:border-b-ink-900",
  danger:
    "border-vermilion-600 bg-paper-0 text-vermilion-600 hover:bg-vermilion-600 hover:text-paper-50",
  marketing:
    "border-ink-900 bg-vermilion-600 text-paper-50 hover:ring-1 hover:ring-inset hover:ring-ink-900",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
  xl: "h-14 px-6 text-base",
};

/** Safe to call from Server Components (no `"use client"` in this module). */
export function buttonLinkClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-3 whitespace-nowrap border rounded-sm font-sans font-[500] leading-[1.3] tracking-[0.01em]",
    "transition-[background-color,color,border-color,box-shadow] duration-[80ms] [transition-timing-function:var(--ease-editorial)]",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion-600 focus-visible:ring-offset-1 focus-visible:ring-offset-paper-50",
    "disabled:cursor-not-allowed disabled:opacity-40",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}
