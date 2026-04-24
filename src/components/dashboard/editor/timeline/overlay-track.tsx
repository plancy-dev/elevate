"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
  useEditorPlayback,
} from "@/components/dashboard/editor/store";
import { EDITOR_DSL_MAX_OVERLAYS } from "@/lib/studio-productions/editor-dsl";

/**
 * Overlay track — S2 skeleton showing existing cards + an add button.
 * S5 fills in drag/resize and selects overlays for the inspector.
 */
export function OverlayTrack({ pxPerSec }: { pxPerSec: number }) {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const dispatch = useEditorDispatch();
  const playback = useEditorPlayback();
  const atCapacity = dsl.overlays.length >= EDITOR_DSL_MAX_OVERLAYS;

  return (
    <div className="relative h-full">
      {dsl.overlays.map((overlay) => {
        const left = overlay.startSec * pxPerSec;
        const width = Math.max(
          (overlay.endSec - overlay.startSec) * pxPerSec,
          32,
        );
        return (
          <button
            key={overlay.id}
            type="button"
            onClick={() =>
              dispatch({
                type: "select",
                selection: { kind: "overlay", overlayId: overlay.id },
              })
            }
            className="absolute top-1 bottom-1 flex items-center overflow-hidden rounded border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 text-[10px] text-fuchsia-900 hover:bg-fuchsia-500/20 dark:text-fuchsia-200/95"
            style={{ left, width }}
          >
            <span className="truncate">{overlay.text || "(empty)"}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "addOverlay",
            atSec: playback.currentTimeSec,
            totalSec: dsl.totalDurationSec,
          })
        }
        disabled={atCapacity}
        aria-label={t("overlayAddAria")}
        className="absolute right-1 top-1 bottom-1 flex items-center gap-1 rounded border border-dashed border-border-subtle bg-layer-01 px-2 text-[10px] text-text-secondary hover:border-fuchsia-500/40 hover:text-fuchsia-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-3 w-3" aria-hidden />
        {t("overlayAdd")}
      </button>
    </div>
  );
}
