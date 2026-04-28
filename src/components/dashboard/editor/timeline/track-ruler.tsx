"use client";

/**
 * Time ruler for the timeline. Draws a tick every second with a label
 * every 5 seconds. The ruler aligns with the scene/overlay/audio tracks
 * via the shared `pxPerSec` scale.
 */
export function TrackRuler({
  totalSec,
  pxPerSec,
}: {
  totalSec: number;
  pxPerSec: number;
}) {
  const ticks = Math.ceil(totalSec) + 1;
  return (
    <div className="flex items-stretch gap-2">
      <div className="w-20 shrink-0" aria-hidden />
      <div className="relative h-5 flex-1 select-none">
        {Array.from({ length: ticks }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full"
            style={{ left: i * pxPerSec }}
          >
            <div className="h-2 w-px bg-ink-100" />
            {i % 5 === 0 ? (
              <span className="absolute top-2 left-0 -translate-x-1/2 font-mono text-[9px] text-ink-500">
                {i}s
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
