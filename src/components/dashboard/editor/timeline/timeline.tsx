"use client";

import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
  useEditorPlayback,
} from "@/components/dashboard/editor/store";
import { TrackRuler } from "@/components/dashboard/editor/timeline/track-ruler";
import { SceneTrack } from "@/components/dashboard/editor/timeline/scene-track";
import { OverlayTrack } from "@/components/dashboard/editor/timeline/overlay-track";
import { AudioTrack } from "@/components/dashboard/editor/timeline/audio-track";

/**
 * Timeline — holds the three tracks and the shared time ruler. Track widths
 * are pixels-per-second scaled, so the ruler and tracks share the same
 * scale. Zoom is implicit: total duration + available width decides it.
 */
export function Timeline() {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const playback = useEditorPlayback();
  const dispatch = useEditorDispatch();
  // Pixels per second — simple fixed scale, wide enough for a 60s shorts
  // to breathe. The container scrolls horizontally when needed.
  const pxPerSec = 40;
  const widthPx = Math.max(
    dsl.totalDurationSec * pxPerSec,
    600,
  );
  // Playhead X in pixels, relative to the track area (after the 80-px label
  // column). Reused by the ruler overlay.
  const playheadX =
    Math.max(0, Math.min(playback.currentTimeSec, dsl.totalDurationSec)) *
    pxPerSec;

  const handleScrub = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = event.clientX - rect.left;
    const sec = Math.max(
      0,
      Math.min(relative / pxPerSec, dsl.totalDurationSec),
    );
    dispatch({
      type: "setPlayback",
      playback: { currentTimeSec: sec, isPlaying: false },
    });
  };

  return (
    <div className="flex flex-col gap-1 overflow-x-auto px-3 pt-3 pb-4">
      <div style={{ width: widthPx }} className="flex flex-col gap-1">
        <div
          onClick={handleScrub}
          className="relative cursor-col-resize"
          role="presentation"
        >
          <TrackRuler totalSec={dsl.totalDurationSec} pxPerSec={pxPerSec} />
        </div>
        <TrackLabelRow label={t("trackScenes")} playheadX={playheadX}>
          <SceneTrack pxPerSec={pxPerSec} />
        </TrackLabelRow>
        <TrackLabelRow label={t("trackOverlays")} playheadX={playheadX}>
          <OverlayTrack pxPerSec={pxPerSec} />
        </TrackLabelRow>
        <TrackLabelRow label={t("trackAudio")} playheadX={playheadX}>
          <AudioTrack pxPerSec={pxPerSec} />
        </TrackLabelRow>
      </div>
    </div>
  );
}

function TrackLabelRow({
  label,
  children,
  playheadX,
}: {
  label: string;
  children: React.ReactNode;
  playheadX: number;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <div className="sticky left-0 z-10 w-20 shrink-0 rounded-md border border-border-subtle bg-layer-02 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </div>
      <div className="relative min-h-[38px] flex-1 rounded-md border border-border-subtle bg-layer-02/50">
        {children}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: playheadX }}
          aria-hidden
        />
      </div>
    </div>
  );
}
