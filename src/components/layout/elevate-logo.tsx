import { cn } from "@/lib/utils";

interface ElevateLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { box: "h-7 w-7", text: "text-sm", font: "text-[15px]" },
  md: { box: "h-8 w-8", text: "text-base", font: "text-[17px]" },
  lg: { box: "h-10 w-10", text: "text-lg", font: "text-xl" },
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
          "relative flex items-center justify-center bg-primary",
        )}
      >
        <span
          className={cn(
            s.font,
            "font-serif italic font-bold text-white leading-none select-none",
          )}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          e
        </span>
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
