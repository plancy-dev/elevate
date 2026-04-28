import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";
import { Plate, type PlateProps } from "@/components/desk/Plate";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

/**
 * @deprecated Use `@/components/desk/Plate` directly for new code.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <Plate
        ref={ref}
        padding="none"
        className={cn(
          "border-ink-700 bg-paper-100",
          hoverable &&
            "transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-0",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export const PlateHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-b border-ink-100 px-4 py-3", className)}
    {...props}
  />
));

PlateHeader.displayName = "PlateHeader";

export const CardHeader = PlateHeader;

CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("px-4 py-3", className)} {...props} />;
});

CardContent.displayName = "CardContent";

export { Plate };
export type { PlateProps };
