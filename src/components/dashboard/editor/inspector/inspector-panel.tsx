"use client";

import { useTranslations } from "next-intl";
import { useEditorSelection } from "@/components/dashboard/editor/store";
import { SceneInspector } from "@/components/dashboard/editor/inspector/scene-inspector";
import { OverlayInspector } from "@/components/dashboard/editor/inspector/overlay-inspector";
import { AudioInspector } from "@/components/dashboard/editor/inspector/audio-inspector";

export function InspectorPanel() {
  const t = useTranslations("Dashboard.productions.editor");
  const selection = useEditorSelection();

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border-subtle px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          {t("inspectorTitle")}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {selection.kind === "none" ? (
          <p className="text-xs text-text-tertiary">{t("inspectorEmpty")}</p>
        ) : null}
        {selection.kind === "scene" ? <SceneInspector /> : null}
        {selection.kind === "overlay" ? <OverlayInspector /> : null}
        {selection.kind === "audio" ? (
          <AudioInspector target={selection.target} />
        ) : null}
      </div>
    </div>
  );
}
