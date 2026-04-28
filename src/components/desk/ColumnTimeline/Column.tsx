import { cn } from "@/lib/utils";

type ColumnProps = {
  index: number;
  title: string;
  startSec: number;
  durationSec: number;
  selected: boolean;
  hasSource: boolean;
  onSelect: () => void;
};

function formatTimecode(totalSec: number) {
  const sec = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function Column({
  index,
  title,
  startSec,
  durationSec,
  selected,
  hasSource,
  onSelect,
}: ColumnProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "h-[320px] w-[280px] shrink-0 border border-ink-100 bg-paper-100 p-4 text-left transition-colors duration-80 ease-(--ease-editorial)",
        selected && "border-vermilion-600",
      )}
      title={title}
    >
      <div className="mb-5 flex items-start justify-between">
        <span className="text-[32px] leading-none text-ink-900 [font-family:var(--font-display)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
          {formatTimecode(startSec)}
        </span>
      </div>
      <div className="mb-3 h-px bg-ink-100" />
      <p className="line-clamp-6 text-sm leading-6 text-ink-700">
        {title}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-2 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
        <span>{hasSource ? "Source" : "Missing"}</span>
        <span>{durationSec.toFixed(1)}s</span>
      </div>
    </button>
  );
}
