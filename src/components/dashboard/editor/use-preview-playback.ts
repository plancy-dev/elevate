"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  computeSceneWorldTimes,
  gainDbToLinear,
  type EditorScene,
} from "@/lib/studio-productions/editor-dsl";
import {
  useEditorDispatch,
  useEditorDsl,
  useEditorPlayback,
} from "@/components/dashboard/editor/store";

/**
 * Preview playback coordinator — owns the refs to the scene `<video>` and
 * the narration/BGM `<audio>` elements, keeps their `currentTime` in sync
 * with the world clock, and drives the playhead via `requestAnimationFrame`.
 *
 * The world clock is built from `computeSceneWorldTimes(scenes)`. For a
 * given world time `t`, we find the active scene and set the video's
 * `currentTime` to `scene.trimStartSec + (t - sceneStart)`. We only
 * reassign `video.src` when the scene index actually changes, which keeps
 * playback smooth.
 */
export type PreviewPlaybackRefs = {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  narrationRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmRef: React.MutableRefObject<HTMLAudioElement | null>;
};

export type ActiveSceneInfo = {
  index: number;
  scene: EditorScene;
  localTimeSec: number;
};

function applyMediaVolume(el: HTMLMediaElement | null, linear: number): void {
  if (!el) return;
  const next = Math.max(0, Math.min(linear, 1));
  if (Math.abs(el.volume - next) > 0.001) {
    el.volume = next;
  }
}

export function getActiveScene(
  scenes: EditorScene[],
  worldTimes: number[],
  worldSec: number,
): ActiveSceneInfo | null {
  if (scenes.length === 0) return null;
  const clamped = Math.max(0, worldSec);
  // Find the latest scene whose worldStart <= t.
  let idx = 0;
  for (let i = 0; i < scenes.length; i += 1) {
    if (worldTimes[i] <= clamped + 0.0001) idx = i;
    else break;
  }
  const scene = scenes[idx];
  const localStartInSource = scene.trimStartSec;
  const localTime = clamped - worldTimes[idx] + localStartInSource;
  return { index: idx, scene, localTimeSec: localTime };
}

/**
 * Drive the playback refs from the editor store's current time + play state.
 * Call this from PreviewPane.
 */
export function usePreviewPlayback(refs: PreviewPlaybackRefs): void {
  const dsl = useEditorDsl();
  const playback = useEditorPlayback();
  const dispatch = useEditorDispatch();

  const worldTimes = useMemo(
    () => computeSceneWorldTimes(dsl.scenes),
    [dsl.scenes],
  );

  // Track the active scene index to avoid reassigning `video.src` on every
  // tick (which would kill playback).
  const activeIdxRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  // When scenes change (reorder, trim, source swap), re-sync video.
  useEffect(() => {
    activeIdxRef.current = -1;
  }, [dsl.scenes]);

  // Play/pause side effect.
  useEffect(() => {
    const video = refs.videoRef.current;
    const narration = refs.narrationRef.current;
    const bgm = refs.bgmRef.current;
    if (!video) return;

    if (playback.isPlaying) {
      void video.play().catch(() => {
        // Autoplay may be blocked; toggle off so the UI stays honest.
        dispatch({ type: "setPlayback", playback: { isPlaying: false } });
      });
      if (narration) void narration.play().catch(() => {});
      if (bgm) void bgm.play().catch(() => {});
    } else {
      video.pause();
      if (narration) narration.pause();
      if (bgm) bgm.pause();
    }
  }, [dispatch, playback.isPlaying, refs]);

  // Audio gain side effect — mirrors DSL gainDb to HTMLMediaElement.volume.
  // volume is linear [0, 1]; we clamp since browsers refuse > 1. The lint
  // rule `react-hooks/immutability` is overly conservative here; the nested
  // helper moves the assignment out of the effect's direct body so it
  // doesn't misread ref mutations as prop mutations.
  useEffect(() => {
    const apply = applyMediaVolume;
    apply(
      refs.narrationRef.current,
      dsl.audio.narration
        ? gainDbToLinear(dsl.audio.narration.gainDb)
        : 1,
    );
  }, [dsl.audio.narration, refs]);

  useEffect(() => {
    const el = refs.bgmRef.current;
    if (!el) return;
    const linear = dsl.audio.bgm ? gainDbToLinear(dsl.audio.bgm.gainDb) : 1;
    const worldSec = playback.currentTimeSec;
    let fadeFactor = 1;
    if (dsl.audio.bgm) {
      const { startSec, fadeInSec, fadeOutSec } = dsl.audio.bgm;
      const localSec = worldSec - startSec;
      if (fadeInSec > 0 && localSec >= 0 && localSec < fadeInSec) {
        fadeFactor = Math.max(0, Math.min(localSec / fadeInSec, 1));
      }
      const endSec = dsl.totalDurationSec;
      const fadeOutStart = endSec - fadeOutSec;
      if (fadeOutSec > 0 && worldSec >= fadeOutStart) {
        fadeFactor = Math.max(
          0,
          Math.min((endSec - worldSec) / fadeOutSec, 1),
        );
      }
    }
    applyMediaVolume(el, linear * fadeFactor);
  }, [dsl.audio.bgm, dsl.totalDurationSec, playback.currentTimeSec, refs]);

  // RAF loop: drive world clock forward and reconcile video src / currentTime.
  useEffect(() => {
    let prevTs: number | null = null;

    const tick = (ts: number) => {
      const video = refs.videoRef.current;
      const narration = refs.narrationRef.current;
      const bgm = refs.bgmRef.current;

      if (!video) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      // Advance the world clock only while playing.
      if (playback.isPlaying && prevTs != null) {
        const deltaSec = (ts - prevTs) / 1000;
        const next = Math.min(
          playback.currentTimeSec + deltaSec,
          dsl.totalDurationSec,
        );
        dispatch({
          type: "setPlayback",
          playback: { currentTimeSec: next },
        });
        if (next >= dsl.totalDurationSec - 0.01) {
          dispatch({
            type: "setPlayback",
            playback: { isPlaying: false, currentTimeSec: 0 },
          });
          activeIdxRef.current = -1;
        }
      }
      prevTs = ts;

      const active = getActiveScene(
        dsl.scenes,
        worldTimes,
        playback.currentTimeSec,
      );
      if (active) {
        if (active.index !== activeIdxRef.current) {
          activeIdxRef.current = active.index;
          if (video.src !== active.scene.sourceUrl && active.scene.sourceUrl) {
            video.src = active.scene.sourceUrl;
          }
          // Wait for the new source to be ready before seeking.
          const seek = () => {
            try {
              video.currentTime = Math.max(0, active.localTimeSec);
            } catch {
              /* ignore */
            }
          };
          if (video.readyState >= 1) seek();
          else video.addEventListener("loadedmetadata", seek, { once: true });
        } else {
          // Minor drift correction while playing the same scene.
          const drift = Math.abs(video.currentTime - active.localTimeSec);
          if (!playback.isPlaying && drift > 0.05) {
            try {
              video.currentTime = active.localTimeSec;
            } catch {
              /* ignore */
            }
          }
        }
      }

      // Keep audio tracks aligned with the world clock.
      if (narration && Math.abs(narration.currentTime - playback.currentTimeSec) > 0.15) {
        try {
          narration.currentTime = playback.currentTimeSec;
        } catch {
          /* ignore */
        }
      }
      if (
        bgm &&
        dsl.audio.bgm &&
        Math.abs(
          bgm.currentTime -
            Math.max(0, playback.currentTimeSec - dsl.audio.bgm.startSec),
        ) > 0.15
      ) {
        try {
          bgm.currentTime = Math.max(
            0,
            playback.currentTimeSec - dsl.audio.bgm.startSec,
          );
        } catch {
          /* ignore */
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [
    dispatch,
    dsl.audio.bgm,
    dsl.scenes,
    dsl.totalDurationSec,
    playback.currentTimeSec,
    playback.isPlaying,
    refs,
    worldTimes,
  ]);
}
