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
      <h3 className="text-sm font-semibold text-ink-900">
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
      <label className="flex items-center gap-2 text-xs text-ink-700">
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
          className="inline-block font-mono text-[11px] text-vermilion-600 underline underline-offset-2"
        >
          {t("sceneSourceOpen")}
        </a>
      ) : (
        <p className="font-mono text-[11px] text-vermilion-600">
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
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
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
        className="h-9 w-full border-b border-ink-300 bg-transparent px-0 text-sm text-ink-900 outline-none focus:border-vermilion-600"
      />
    </label>
  );
}
