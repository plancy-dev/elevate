import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type PlatePadding = "none" | "sm" | "md" | "lg";

export interface PlateProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  padding?: PlatePadding;
}

const paddingClass: Record<PlatePadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Plate = forwardRef<HTMLDivElement, PlateProps>(
  ({ className, selected = false, padding = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative border border-ink-700 bg-paper-100 text-ink-900 rounded-none",
          paddingClass[padding],
          selected &&
            "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-vermilion-600",
          className,
        )}
        {...props}
      />
    );
  },
);

Plate.displayName = "Plate";
