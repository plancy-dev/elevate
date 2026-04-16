"use client";

import { cn } from "@/lib/utils";
import Link, { useLinkStatus } from "next/link";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "danger"
  /** Marketing chrome only: warm orange pill CTA (see `docs/design/SYSTEM.md`) */
  | "marketing";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-transparent bg-surface-03 text-text-primary hover:bg-surface-hover active:bg-[#d6d6d6] dark:active:bg-[#333333]",
  tertiary:
    "border border-interactive bg-transparent text-interactive hover:bg-interactive hover:text-white active:bg-primary-hover",
  ghost:
    "bg-transparent text-interactive hover:bg-surface-03/80 active:bg-surface-hover dark:active:bg-surface-02",
  danger: "bg-danger text-white hover:bg-[#BA1B23] active:bg-[#750E13]",
  marketing:
    "rounded-full border-0 bg-marketing-accent text-white hover:bg-marketing-accent-hover active:bg-[#c03d00] focus:outline-marketing-accent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-sm",
  xl: "h-14 px-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-100 cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variant !== "marketing" && "rounded-lg",
          variant !== "marketing" &&
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          variant === "marketing" &&
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export function buttonLinkClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-100 cursor-pointer",
    variant !== "marketing" && "rounded-lg",
    variant === "marketing"
      ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

function ButtonLinkNavPendingOverlay() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-layer-01/75 backdrop-blur-[0.5px] dark:bg-black/50"
      aria-hidden
    >
      <svg
        className="h-4 w-4 animate-spin text-primary"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </span>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden",
        buttonLinkClassName(variant, size, className),
      )}
    >
      <ButtonLinkNavPendingOverlay />
      <span className="relative inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}
