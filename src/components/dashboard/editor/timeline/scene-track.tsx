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
      <p className="px-3 py-2 font-mono text-[11px] text-ink-500">
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
              "absolute top-1 bottom-1 flex items-center gap-1 overflow-hidden border px-2 text-left font-mono text-[10px] transition-colors duration-80 ease-(--ease-editorial)",
              hasSource
                ? "border-ink-300 bg-paper-0 text-ink-700 hover:border-ink-900 hover:text-ink-900"
                : "border-vermilion-600/40 bg-vermilion-100/40 text-vermilion-600",
              isSelected && "border-vermilion-600 text-ink-900",
              isBeingDragged && "opacity-40",
              isDropTarget && "border-vermilion-600",
            )}
            style={{ left, width }}
            title={scene.sourceUrl || t("sceneSourceMissing")}
          >
            <span className="truncate">#{i + 1}</span>
            {scene.loop ? (
              <span className="border border-ink-100 bg-paper-100 px-0.5 text-[8px] uppercase text-ink-500">
                {t("sceneBadgeLoop")}
              </span>
            ) : null}
            {(scene.transitionToNextMs ?? 0) > 0 && i < dsl.scenes.length - 1 ? (
              <span className="border border-ink-100 bg-paper-100 px-0.5 text-[8px] uppercase text-ink-500">
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
