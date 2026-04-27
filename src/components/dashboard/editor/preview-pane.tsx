"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
  useEditorPlayback,
} from "@/components/dashboard/editor/store";
import { usePreviewPlayback } from "@/components/dashboard/editor/use-preview-playback";
import { OverlayLayer } from "@/components/dashboard/editor/overlay-layer";
import { Button } from "@/components/ui/button";

/**
 * PreviewPane — S3 owns video playback. S5 overlays the canvas via
 * `OverlayLayer`. S6 wires narration + BGM audio elements.
 */
export function PreviewPane() {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const playback = useEditorPlayback();
  const dispatch = useEditorDispatch();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  usePreviewPlayback({ videoRef, narrationRef, bgmRef });

  const aspect = dsl.resolution.width / dsl.resolution.height;
  const anyScene = dsl.scenes.some((s) => s.sourceUrl.length > 0);

  const togglePlay = () => {
    if (!anyScene) return;
    dispatch({
      type: "setPlayback",
      playback: { isPlaying: !playback.isPlaying },
    });
  };

  const resetTime = () => {
    dispatch({
      type: "setPlayback",
      playback: { isPlaying: false, currentTimeSec: 0 },
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-full max-w-[360px] overflow-hidden rounded-xl border border-border-subtle bg-black shadow-lg"
        style={{ aspectRatio: String(aspect) }}
      >
        {anyScene ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            muted
            preload="metadata"
          />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-white/70">
            {t("previewSkeleton")}
          </p>
        )}
        <OverlayLayer />
        {/* Hidden audio tracks — user can hear the preview because browsers
            mix audio elements with video automatically. Narration is the
            mixable layer; BGM rides in parallel. */}
        {dsl.audio.narration ? (
          <audio
            ref={narrationRef}
            src={dsl.audio.narration.url}
            preload="metadata"
            className="hidden"
          />
        ) : null}
        {dsl.audio.bgm ? (
          <audio
            ref={bgmRef}
            src={dsl.audio.bgm.url}
            preload="metadata"
            className="hidden"
          />
        ) : null}
      </div>
      <PreviewControls
        isPlaying={playback.isPlaying}
        currentTime={playback.currentTimeSec}
        totalDuration={dsl.totalDurationSec}
        onTogglePlay={togglePlay}
        onReset={resetTime}
        onSeek={(sec) =>
          dispatch({
            type: "setPlayback",
            playback: { currentTimeSec: sec },
          })
        }
        playLabel={t("previewPlay")}
        pauseLabel={t("previewPause")}
        resetLabel={t("previewReset")}
        disabled={!anyScene}
      />
    </div>
  );
}

function PreviewControls(props: {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (sec: number) => void;
  playLabel: string;
  pauseLabel: string;
  resetLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="flex w-full max-w-[360px] items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={props.onReset}
        disabled={props.disabled}
        aria-label={props.resetLabel}
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={props.onTogglePlay}
        disabled={props.disabled}
        aria-label={props.isPlaying ? props.pauseLabel : props.playLabel}
      >
        {props.isPlaying ? (
          <Pause className="h-4 w-4" aria-hidden />
        ) : (
          <Play className="h-4 w-4" aria-hidden />
        )}
      </Button>
      <input
        type="range"
        min={0}
        max={props.totalDuration}
        step={0.05}
        value={props.currentTime}
        onChange={(e) => props.onSeek(Number(e.target.value))}
        disabled={props.disabled}
        className="flex-1"
      />
      <span className="w-16 text-right text-[11px] tabular-nums text-text-tertiary">
        {props.currentTime.toFixed(1)} / {props.totalDuration.toFixed(1)}s
      </span>
    </div>
  );
}
