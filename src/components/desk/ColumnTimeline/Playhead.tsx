import { cn } from "@/lib/utils";

type PlayheadProps = {
  leftPx: number;
  playing: boolean;
};

export function Playhead({ leftPx, playing }: PlayheadProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-20"
      style={{ left: leftPx }}
      aria-hidden
    >
      <span
        className={cn(
          "absolute -top-4 left-[-8px] text-lg leading-none text-vermilion-600 [font-family:var(--font-display)] transition-transform duration-160 ease-(--ease-editorial)",
          playing ? "rotate-90" : "rotate-0",
        )}
      >
        ▸
      </span>
      <span className="block h-full w-0.5 bg-vermilion-600" />
    </div>
  );
}
