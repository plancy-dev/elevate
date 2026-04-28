"use client";

import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
} from "@/components/dashboard/editor/store";

/**
 * Audio track — S2 skeleton. Two rows: narration (TTS) + BGM.
 * S6 adds gain sliders directly on the track and drag-to-shift for BGM.
 */
export function AudioTrack({ pxPerSec }: { pxPerSec: number }) {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const dispatch = useEditorDispatch();
  const totalWidth = dsl.totalDurationSec * pxPerSec;

  return (
    <div className="flex h-full flex-col gap-1 p-1">
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "select",
            selection: { kind: "audio", target: "narration" },
          })
        }
        className="h-4 overflow-hidden border border-ink-300 bg-paper-0 px-2 text-left font-mono text-[9px] text-ink-700 transition-colors duration-80 ease-(--ease-editorial) hover:border-ink-900 hover:text-ink-900"
        style={{ width: totalWidth }}
      >
        {dsl.audio.narration ? t("audioNarrationPresent") : t("audioNarrationMissing")}
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "select",
            selection: { kind: "audio", target: "bgm" },
          })
        }
        className="h-4 overflow-hidden border border-ink-300 bg-paper-0 px-2 text-left font-mono text-[9px] text-ink-700 transition-colors duration-80 ease-(--ease-editorial) hover:border-ink-900 hover:text-ink-900"
        style={{ width: totalWidth }}
      >
        {dsl.audio.bgm ? t("audioBgmPresent") : t("audioBgmMissing")}
      </button>
    </div>
  );
}
