import { cn } from "@/lib/utils";

type ShortcutDensity = "inline" | "block";

export interface ShortcutBadgeProps {
  keys: ReadonlyArray<string>;
  density?: ShortcutDensity;
  className?: string;
}

export function ShortcutBadge({
  keys,
  density = "inline",
  className,
}: ShortcutBadgeProps) {
  if (keys.length === 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center gap-1 border border-ink-300 bg-paper-0 px-1.5 py-0.5 font-mono uppercase text-ink-500",
        density === "inline"
          ? "text-[11px] leading-[1.1] tracking-[0.04em]"
          : "text-[12px] leading-[1.2] tracking-[0.04em]",
        className,
      )}
    >
      {keys.map((key, index) => (
        <span key={`${key}-${index}`}>{key}</span>
      ))}
    </span>
  );
}
