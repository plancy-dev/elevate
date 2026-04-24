"use client";

import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useSelectedScene,
  type EditorScene,
} from "@/components/dashboard/editor/store";

/**
 * SceneInspector — S2 skeleton exposing the scene fields as plain inputs.
 * S4 will add trim/loop/transition controls with proper sliders.
 */
export function SceneInspector() {
  const t = useTranslations("Dashboard.productions.editor");
  const scene = useSelectedScene();
  const dispatch = useEditorDispatch();
  if (!scene) return null;

  const update = (patch: Partial<EditorScene>) => {
    dispatch({ type: "updateScene", sceneId: scene.id, patch });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">
        {t("sceneInspectorTitle")}
      </h3>
      <NumberField
        label={t("sceneDuration")}
        value={scene.targetDurationSec}
        min={0.5}
        max={60}
        step={0.1}
        onChange={(v) => update({ targetDurationSec: v })}
      />
      <NumberField
        label={t("sceneTrimStart")}
        value={scene.trimStartSec}
        min={0}
        max={600}
        step={0.1}
        onChange={(v) => update({ trimStartSec: v })}
      />
      <NumberField
        label={t("sceneTransitionMs")}
        value={scene.transitionToNextMs ?? 0}
        min={0}
        max={2000}
        step={50}
        onChange={(v) => update({ transitionToNextMs: v })}
      />
      <label className="flex items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={scene.loop}
          onChange={(e) => update({ loop: e.target.checked })}
        />
        {t("sceneLoop")}
      </label>
      {scene.sourceUrl ? (
        <a
          href={scene.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] text-interactive underline underline-offset-2"
        >
          {t("sceneSourceOpen")}
        </a>
      ) : (
        <p className="text-[11px] text-amber-800 dark:text-amber-200/95">
          {t("sceneSourceMissing")}
        </p>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-text-secondary">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-sm"
      />
    </label>
  );
}
