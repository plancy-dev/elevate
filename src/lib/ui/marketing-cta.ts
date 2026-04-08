import { cn } from "@/lib/utils";

/** Primary CTA on marketing chrome: orange pill; overrides default blue `Button` / `buttonLinkClassName`. */
export function marketingPrimaryCtaClassName(className?: string) {
  return cn(
    "rounded-full border-0 bg-marketing-accent text-white hover:bg-marketing-accent-hover active:bg-[#c03d00]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marketing-accent",
    className,
  );
}
