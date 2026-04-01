import Image from "next/image";
import { cn } from "@/lib/utils";

interface ElevateLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { box: "h-7 w-7", text: "text-sm", px: 28 },
  md: { box: "h-8 w-8", text: "text-base", px: 32 },
  lg: { box: "h-10 w-10", text: "text-lg", px: 40 },
};

export function ElevateLogo({
  className,
  size = "md",
  showText = true,
}: ElevateLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          s.box,
          "relative shrink-0 overflow-hidden rounded-full bg-transparent ring-1 ring-black/10 dark:ring-white/15",
        )}
      >
        <Image
          src="/brand/elevate-mark-192.png"
          alt=""
          width={s.px}
          height={s.px}
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <span
          className={cn(
            s.text,
            "font-semibold tracking-[-0.02em] text-text-primary",
          )}
        >
          Elevate
        </span>
      )}
    </div>
  );
}
