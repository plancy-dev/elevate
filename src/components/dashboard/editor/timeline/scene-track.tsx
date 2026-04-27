"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
  useEditorSelection,
} from "@/components/dashboard/editor/store";
import { computeSceneWorldTimes } from "@/lib/studio-productions/editor-dsl";
import { cn } from "@/lib/utils";

/**
 * Scene track — draggable scene blocks with HTML5 native DnD. Clicking a
 * block selects it for the inspector; dragging reorders. Trim handles are
 * a future-tier nicety; for now the inspector exposes numeric trim fields.
 */
export function SceneTrack({ pxPerSec }: { pxPerSec: number }) {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const dispatch = useEditorDispatch();
  const selection = useEditorSelection();
  const worldTimes = computeSceneWorldTimes(dsl.scenes);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (dsl.scenes.length === 0) {
    return (
      <p className="px-3 py-2 text-[11px] text-text-tertiary">
        {t("sceneTrackEmpty")}
      </p>
    );
  }

  const handleDrop = (toIndex: number) => {
    if (dragIndex == null || dragIndex === toIndex) return;
    dispatch({ type: "reorderScene", fromIndex: dragIndex, toIndex });
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="relative h-full">
      {dsl.scenes.map((scene, i) => {
        const left = worldTimes[i] * pxPerSec;
        const width = Math.max(scene.targetDurationSec * pxPerSec, 48);
        const hasSource = scene.sourceUrl.length > 0;
        const isSelected =
          selection.kind === "scene" && selection.sceneId === scene.id;
        const isBeingDragged = dragIndex === i;
        const isDropTarget = overIndex === i && dragIndex != null && dragIndex !== i;
        return (
          <button
            key={scene.id}
            type="button"
            draggable
            onDragStart={(e) => {
              setDragIndex(i);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(i));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overIndex !== i) setOverIndex(i);
            }}
            onDragLeave={() => {
              if (overIndex === i) setOverIndex(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(i);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onClick={() =>
              dispatch({
                type: "select",
                selection: { kind: "scene", sceneId: scene.id },
              })
            }
            className={cn(
              "absolute top-1 bottom-1 flex items-center gap-1 overflow-hidden rounded border px-2 text-left text-[10px] font-medium transition-shadow",
              hasSource
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100/95",
              isSelected && "ring-2 ring-primary ring-offset-1",
              isBeingDragged && "opacity-40",
              isDropTarget && "ring-2 ring-primary/60",
            )}
            style={{ left, width }}
            title={scene.sourceUrl || t("sceneSourceMissing")}
          >
            <span className="truncate">#{i + 1}</span>
            {scene.loop ? (
              <span className="rounded-sm bg-white/30 px-0.5 text-[8px] uppercase">
                {t("sceneBadgeLoop")}
              </span>
            ) : null}
            {(scene.transitionToNextMs ?? 0) > 0 && i < dsl.scenes.length - 1 ? (
              <span className="rounded-sm bg-white/30 px-0.5 text-[8px] uppercase">
                {t("sceneBadgeTransition", {
                  ms: scene.transitionToNextMs ?? 0,
                })}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
