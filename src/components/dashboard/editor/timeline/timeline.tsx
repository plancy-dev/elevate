"use client";

import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
  useEditorPlayback,
  useEditorSelection,
} from "@/components/dashboard/editor/store";
import { SceneTrack } from "@/components/dashboard/editor/timeline/scene-track";
import { OverlayTrack } from "@/components/dashboard/editor/timeline/overlay-track";
import { AudioTrack } from "@/components/dashboard/editor/timeline/audio-track";
import { Column, Playhead, Rule } from "@/components/desk/ColumnTimeline";
import { computeSceneWorldTimes } from "@/lib/studio-productions/editor-dsl";

/**
 * Timeline — holds the three tracks and the shared time ruler. Track widths
 * are pixels-per-second scaled, so the ruler and tracks share the same
 * scale. Zoom is implicit: total duration + available width decides it.
 */
export function Timeline() {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const playback = useEditorPlayback();
  const selection = useEditorSelection();
  const dispatch = useEditorDispatch();
  const pxPerSec = 40;
  const widthPx = Math.max(dsl.totalDurationSec * pxPerSec, 600);
  const sceneStarts = computeSceneWorldTimes(dsl.scenes);
  const columnWidth = 280;
  const columnGap = 1;
  const columnSpan = columnWidth + columnGap;
  const columnAreaWidth = Math.max(
    dsl.scenes.length > 0 ? dsl.scenes.length * columnSpan - columnGap : columnWidth,
    600,
  );
  const playheadX =
    dsl.scenes.length > 0
      ? getColumnPlayheadX(
          playback.currentTimeSec,
          dsl.totalDurationSec,
          dsl.scenes,
          sceneStarts,
          columnWidth,
          columnSpan,
        )
      : Math.max(0, Math.min(playback.currentTimeSec, dsl.totalDurationSec)) * pxPerSec;

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
    <div className="flex flex-col gap-3 overflow-x-auto px-3 pt-3 pb-4">
      <div className="overflow-x-auto">
        <div
          className="relative min-h-[320px] cursor-col-resize"
          style={{ width: columnAreaWidth }}
          onClick={(event) => {
            if (dsl.scenes.length === 0) return;
            const sec = getColumnScrubTime(
              event,
              dsl.totalDurationSec,
              dsl.scenes,
              sceneStarts,
              columnWidth,
              columnSpan,
            );
            dispatch({
              type: "setPlayback",
              playback: { currentTimeSec: sec, isPlaying: false },
            });
          }}
        >
          <div className="absolute top-0 left-0 flex h-full">
            {dsl.scenes.length === 0 ? (
              <div className="flex h-[320px] w-[280px] items-center justify-center border border-ink-100 bg-paper-100 px-4 text-center text-sm text-ink-500">
                {t("sceneTrackEmpty")}
              </div>
            ) : (
              dsl.scenes.map((scene, index) => {
                const startSec = sceneStarts[index] ?? 0;
                const selected =
                  selection.kind === "scene" && selection.sceneId === scene.id;
                return (
                  <div key={scene.id} className="flex h-full">
                    <Column
                      index={index}
                      title={scene.sourceArtifactId || t("sceneSourceMissing")}
                      startSec={startSec}
                      durationSec={scene.targetDurationSec}
                      selected={selected}
                      hasSource={scene.sourceUrl.length > 0}
                      onSelect={() =>
                        dispatch({
                          type: "select",
                          selection: { kind: "scene", sceneId: scene.id },
                        })
                      }
                    />
                    {index < dsl.scenes.length - 1 ? <Rule /> : null}
                  </div>
                );
              })
            )}
          </div>
          <Playhead leftPx={playheadX} playing={playback.isPlaying} />
        </div>
      </div>

      <Rule orientation="horizontal" />

      <div style={{ width: widthPx }} className="flex flex-col gap-1">
        <div
          onClick={handleScrub}
          className="relative cursor-col-resize"
          role="presentation"
        >
          <div className="flex items-stretch gap-2">
            <div className="w-20 shrink-0" aria-hidden />
            <div className="relative h-5 flex-1 select-none">
              {Array.from({ length: Math.ceil(dsl.totalDurationSec) + 1 }).map((_, i) => (
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
      <div className="sticky left-0 z-10 w-20 shrink-0 border border-ink-100 bg-paper-100 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-500">
        {label}
      </div>
      <div className="relative min-h-[38px] flex-1 border border-ink-100 bg-paper-50">
        {children}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-vermilion-600"
          style={{ left: playheadX }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function getColumnPlayheadX(
  currentTimeSec: number,
  totalDurationSec: number,
  scenes: Array<{ targetDurationSec: number }>,
  sceneStarts: number[],
  columnWidth: number,
  columnSpan: number,
) {
  const time = Math.max(0, Math.min(currentTimeSec, totalDurationSec));
  const sceneIndex = getSceneIndexAtTime(time, scenes, sceneStarts);
  const sceneStart = sceneStarts[sceneIndex] ?? 0;
  const duration = Math.max(scenes[sceneIndex]?.targetDurationSec ?? 0, 0.001);
  const ratio = Math.max(0, Math.min((time - sceneStart) / duration, 1));
  return sceneIndex * columnSpan + ratio * columnWidth;
}

export function getColumnScrubTime(
  event: React.MouseEvent<HTMLDivElement>,
  totalDurationSec: number,
  scenes: Array<{ targetDurationSec: number }>,
  sceneStarts: number[],
  columnWidth: number,
  columnSpan: number,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  return getColumnScrubTimeFromX(
    event.clientX - rect.left,
    totalDurationSec,
    scenes,
    sceneStarts,
    columnWidth,
    columnSpan,
  );
}

export function getColumnScrubTimeFromX(
  rawXInput: number,
  totalDurationSec: number,
  scenes: Array<{ targetDurationSec: number }>,
  sceneStarts: number[],
  columnWidth: number,
  columnSpan: number,
) {
  const rawX = Math.max(0, rawXInput);
  const sceneIndex = Math.min(
    Math.max(Math.floor(rawX / columnSpan), 0),
    scenes.length - 1,
  );
  const xInColumn = Math.max(
    0,
    Math.min(rawX - sceneIndex * columnSpan, columnWidth),
  );
  const ratio = xInColumn / columnWidth;
  const sceneStart = sceneStarts[sceneIndex] ?? 0;
  const duration = scenes[sceneIndex]?.targetDurationSec ?? 0;
  return Math.max(0, Math.min(sceneStart + duration * ratio, totalDurationSec));
}

export function getSceneIndexAtTime(
  timeSec: number,
  scenes: Array<{ targetDurationSec: number }>,
  sceneStarts: number[],
) {
  for (let i = scenes.length - 1; i >= 0; i -= 1) {
    if (timeSec >= (sceneStarts[i] ?? 0)) return i;
  }
  return 0;
}
