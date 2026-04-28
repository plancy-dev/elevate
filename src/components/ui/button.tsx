"use client";

import { cn } from "@/lib/utils";
import Link, { useLinkStatus } from "next/link";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { ShortcutBadge } from "@/components/desk/ShortcutBadge";
import {
  buttonLinkClassName,
  sizeStyles,
  variantStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button-styles";

export type { ButtonSize, ButtonVariant };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  shortcut?: ReadonlyArray<string>;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      shortcut,
      loadingLabel = "...",
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
          "inline-flex items-center justify-center gap-3 whitespace-nowrap border rounded-sm font-sans font-medium leading-[1.3] tracking-[0.01em]",
          "transition-[background-color,color,border-color,box-shadow] duration-80 ease-(--ease-editorial)",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion-600 focus-visible:ring-offset-1 focus-visible:ring-offset-paper-50",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          shortcut && !isLoading && "justify-between",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
            {loadingLabel}
          </span>
        ) : (
          <>
            <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
              {children}
            </span>
            {shortcut?.length ? (
              <ShortcutBadge keys={shortcut} density="inline" />
            ) : null}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  shortcut?: ReadonlyArray<string>;
};

function ButtonLinkNavPendingOverlay() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-paper-50/75"
      aria-hidden
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-ink-700">
        ...
      </span>
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
  shortcut,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden",
        shortcut && "justify-between",
        buttonLinkClassName(variant, size, className),
      )}
    >
      <ButtonLinkNavPendingOverlay />
      <span className="relative inline-flex min-w-0 items-center justify-center gap-3">
        <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
          {children}
        </span>
        {shortcut?.length ? (
          <ShortcutBadge keys={shortcut} density="inline" />
        ) : null}
      </span>
    </Link>
  );
}
