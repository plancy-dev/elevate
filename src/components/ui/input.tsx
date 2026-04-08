import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Shared text field — `rounded-lg` (10px token), focus ring (Cursor DESIGN.md–aligned).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary",
          "placeholder:text-text-tertiary",
          "transition-colors focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
