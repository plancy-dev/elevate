"use client";

import { useMemo } from "react";
import {
  useEditorDsl,
  useEditorPlayback,
} from "@/components/dashboard/editor/store";
import type { EditorOverlay, OverlayPosition } from "@/lib/studio-productions/editor-dsl";
import { cn } from "@/lib/utils";

/**
 * OverlayLayer — renders active text overlays on top of the video based on
 * the current world time. Uses plain CSS-absolute boxes so we don't pay the
 * canvas overhead for what is ultimately a pile of text blocks.
 *
 * The final rendered video goes through FFmpeg drawtext, so this is a
 * near-approximation; font metrics may differ slightly from the export.
 */
export function OverlayLayer() {
  const dsl = useEditorDsl();
  const playback = useEditorPlayback();

  const active = useMemo(
    () =>
      dsl.overlays.filter(
        (o) =>
          playback.currentTimeSec >= o.startSec &&
          playback.currentTimeSec < o.endSec,
      ),
    [dsl.overlays, playback.currentTimeSec],
  );

  if (active.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {active.map((overlay) => (
        <OverlayCard
          key={overlay.id}
          overlay={overlay}
          playbackTimeSec={playback.currentTimeSec}
        />
      ))}
    </div>
  );
}

function OverlayCard({
  overlay,
  playbackTimeSec,
}: {
  overlay: EditorOverlay;
  playbackTimeSec: number;
}) {
  const { style, animation, animationDurationSec } = overlay;
  const positionStyle = positionToStyle(overlay.position);

  // Animation progress 0..1 during the first `animationDurationSec` of the
  // overlay's life. Clamped so overlays with no animation or tiny durations
  // snap to 1 instantly.
  const age = Math.max(0, playbackTimeSec - overlay.startSec);
  const progress =
    animationDurationSec > 0 ? Math.min(age / animationDurationSec, 1) : 1;

  const animStyle: React.CSSProperties = {};
  if (animation === "fade_in") {
    animStyle.opacity = progress;
  } else if (animation === "slide_up") {
    animStyle.opacity = progress;
    animStyle.transform = `translate(-50%, ${(1 - progress) * 24}px)`;
  } else {
    animStyle.transform = "translate(-50%, 0)";
  }

  const fontFamilyValue =
    style.fontFamily === "serif"
      ? '"Times New Roman", serif'
      : style.fontFamily === "mono"
        ? "ui-monospace, monospace"
        : "system-ui, sans-serif";

  return (
    <div
      className={cn("absolute max-w-[80%] text-center")}
      style={{
        ...positionStyle,
        ...animStyle,
        fontFamily: fontFamilyValue,
        fontSize: `${style.fontSize * 0.45}px`, // preview scale (video is ~360px wide vs 1080 export)
        fontWeight: style.fontWeight,
        color: style.fontColor,
        backgroundColor: withOpacity(style.backgroundColor, style.backgroundOpacity),
        borderRadius: `${style.borderRadius}px`,
        padding: `${style.paddingY}px ${style.paddingX}px`,
        lineHeight: 1.2,
        whiteSpace: "pre-wrap",
      }}
    >
      {overlay.text}
    </div>
  );
}

function positionToStyle(position: OverlayPosition): React.CSSProperties {
  if (position === "top") {
    return { top: "8%", left: "50%", transform: "translate(-50%, 0)" };
  }
  if (position === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  if (position === "bottom") {
    return { bottom: "10%", left: "50%", transform: "translate(-50%, 0)" };
  }
  return {
    top: `${position.yPct}%`,
    left: `${position.xPct}%`,
    transform: "translate(-50%, -50%)",
  };
}

function withOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(Math.max(0, Math.min(opacity, 1)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${alpha}`;
}
