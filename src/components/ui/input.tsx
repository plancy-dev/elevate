import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Shared text field with Editor's Desk v3 bottom-rule style.
 * Label pattern: font-sans text-[12px] uppercase tracking-[0.08em] text-ink-500.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-10 w-full bg-transparent px-0 text-[14px] text-ink-900 caret-vermilion-600",
          "border-b border-ink-300 placeholder:text-ink-500 placeholder:italic",
          "focus:border-b-2 focus:border-vermilion-600 focus:outline-none",
          "font-sans transition-[border-color,border-width] duration-[80ms] [transition-timing-function:var(--ease-editorial)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
