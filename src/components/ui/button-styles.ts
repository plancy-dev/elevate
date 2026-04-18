import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "danger"
  /** Marketing chrome only: warm orange pill CTA (see `docs/design/SYSTEM.md`) */
  | "marketing";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

export const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-transparent bg-surface-03 text-text-primary hover:bg-surface-hover active:bg-[#d6d6d6] dark:active:bg-[#333333]",
  tertiary:
    "border border-interactive bg-transparent text-interactive hover:bg-interactive hover:text-white active:bg-primary-hover",
  ghost:
    "bg-transparent text-interactive hover:bg-surface-03/80 active:bg-surface-hover dark:active:bg-surface-02",
  danger: "bg-danger text-white hover:bg-[#BA1B23] active:bg-[#750E13]",
  marketing:
    "rounded-full border-0 bg-marketing-accent text-white hover:bg-marketing-accent-hover active:bg-[#c03d00]",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-sm",
  xl: "h-14 px-4 text-base",
};

/** Safe to call from Server Components (no `"use client"` in this module). */
export function buttonLinkClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-100 cursor-pointer",
    variant !== "marketing" && "rounded-lg",
    variant === "marketing"
      ? "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marketing-accent"
      : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}
