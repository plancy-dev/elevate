import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

const MARK_GLYPHS = {
  paragraph: "¶",
  section: "§",
  pilcrow: "⁋",
  play: "▸",
  bullet: "•",
  emdash: "—",
  endash: "–",
} as const;

export type MarkName = keyof typeof MARK_GLYPHS;

export interface MarkProps extends HTMLAttributes<HTMLSpanElement> {
  mark: MarkName;
}

export const Mark = forwardRef<HTMLSpanElement, MarkProps>(
  ({ className, mark, ...props }, ref) => {
    return (
      <span
        ref={ref}
        aria-hidden
        className={cn(
          "inline-flex items-center leading-none [font-family:var(--font-display)] text-ink-900",
          className,
        )}
        {...props}
      >
        {MARK_GLYPHS[mark]}
      </span>
    );
  },
);

Mark.displayName = "Mark";
