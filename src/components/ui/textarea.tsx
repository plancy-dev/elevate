import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "min-h-[5rem] w-full bg-transparent px-0 py-2 text-[14px] text-ink-900 caret-vermilion-600",
          "border-b border-ink-300 placeholder:text-ink-500 placeholder:italic",
          "focus:border-b-2 focus:border-vermilion-600 focus:outline-none",
          "font-sans leading-relaxed transition-[border-color,border-width] duration-[80ms] [transition-timing-function:var(--ease-editorial)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
