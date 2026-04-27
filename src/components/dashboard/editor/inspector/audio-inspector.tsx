"use client";

import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useEditorDsl,
} from "@/components/dashboard/editor/store";

/**
 * AudioInspector — S2 skeleton. Gain sliders for narration, URL +
 * gain + fade for BGM. S6 will polish with presets and local file
 * upload.
 */
export function AudioInspector({ target }: { target: "narration" | "bgm" }) {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const dispatch = useEditorDispatch();

  if (target === "narration") {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("audioNarrationTitle")}
        </h3>
        {dsl.audio.narration ? (
          <div className="space-y-2">
            <p className="break-all text-[11px] text-text-tertiary">
              {dsl.audio.narration.url}
            </p>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-text-secondary">
                {t("audioGainDb")}
              </span>
              <input
                type="range"
                min={-30}
                max={6}
                step={1}
                value={dsl.audio.narration.gainDb}
                onChange={(e) =>
                  dispatch({
                    type: "setNarrationGain",
                    gainDb: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-[11px] text-text-tertiary">
                {dsl.audio.narration.gainDb} dB
              </span>
            </label>
          </div>
        ) : (
          <p className="text-xs text-text-tertiary">
            {t("audioNarrationNotAvailable")}
          </p>
        )}
      </div>
    );
  }

  // target === "bgm"
  const bgm = dsl.audio.bgm;
  const updateBgm = (patch: Partial<NonNullable<typeof bgm>>) => {
    const next = bgm
      ? { ...bgm, ...patch }
      : {
          url: patch.url ?? "",
          gainDb: patch.gainDb ?? -6,
          startSec: patch.startSec ?? 0,
          fadeInSec: patch.fadeInSec ?? 0.5,
          fadeOutSec: patch.fadeOutSec ?? 1,
        };
    dispatch({ type: "setBgm", bgm: next });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">
        {t("audioBgmTitle")}
      </h3>
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-text-secondary">
          {t("audioBgmUrl")}
        </span>
        <input
          type="url"
          value={bgm?.url ?? ""}
          onChange={(e) => updateBgm({ url: e.target.value })}
          placeholder="https://…"
          className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-sm"
        />
      </label>
      {bgm?.url ? (
        <>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-text-secondary">
              {t("audioGainDb")}
            </span>
            <input
              type="range"
              min={-30}
              max={6}
              step={1}
              value={bgm.gainDb}
              onChange={(e) =>
                updateBgm({ gainDb: Number(e.target.value) })
              }
              className="w-full"
            />
            <span className="text-[11px] text-text-tertiary">
              {bgm.gainDb} dB
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label={t("audioBgmStartSec")}
              value={bgm.startSec}
              min={0}
              max={600}
              step={0.5}
              onChange={(v) => updateBgm({ startSec: v })}
            />
            <NumberField
              label={t("audioBgmFadeIn")}
              value={bgm.fadeInSec}
              min={0}
              max={10}
              step={0.1}
              onChange={(v) => updateBgm({ fadeInSec: v })}
            />
            <NumberField
              label={t("audioBgmFadeOut")}
              value={bgm.fadeOutSec}
              min={0}
              max={10}
              step={0.1}
              onChange={(v) => updateBgm({ fadeOutSec: v })}
            />
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "setBgm", bgm: null })}
            className="text-[11px] text-danger underline"
          >
            {t("audioBgmRemove")}
          </button>
        </>
      ) : null}
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
