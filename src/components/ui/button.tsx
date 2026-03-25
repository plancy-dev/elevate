import { cn } from "@/lib/utils";
import Link from "next/link";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-[#002D9C]",
  secondary:
    "bg-surface-03 text-text-primary hover:bg-surface-hover active:bg-[#353535] border border-transparent",
  tertiary:
    "bg-transparent text-interactive border border-interactive hover:bg-interactive hover:text-white",
  ghost:
    "bg-transparent text-interactive hover:bg-surface-03 active:bg-[#353535]",
  danger: "bg-danger text-white hover:bg-[#BA1B23] active:bg-[#750E13]",
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
          "focus:outline-2 focus:outline-offset-2 focus:outline-focus",
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

const linkBase =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-100 cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-focus";

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

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
        linkBase,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
