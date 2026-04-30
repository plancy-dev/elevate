import Image from "next/image";
import { cn } from "@/lib/utils";

interface ElevateLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { box: "h-6 w-6", text: "text-sm", px: 24, gap: "gap-1.5" },
  md: { box: "h-8 w-8", text: "text-base", px: 32, gap: "gap-2" },
  lg: { box: "h-10 w-10", text: "text-lg", px: 40, gap: "gap-2.5" },
};

export function ElevateLogo({
  className,
  size = "md",
  showText = true,
}: ElevateLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <div className={cn(s.box, "relative shrink-0 overflow-hidden")}>
        <Image
          src="/brand/elevate-mark-brand-192.png"
          alt=""
          width={s.px}
          height={s.px}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={cn(
            s.text,
            "leading-none font-semibold tracking-[-0.015em] text-ink-900",
          )}
          style={{ fontFamily: "var(--font-editorial)" }}
        >
          Elevate
        </span>
      )}
    </div>
  );
}
