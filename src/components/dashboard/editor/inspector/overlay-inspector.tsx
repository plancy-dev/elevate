"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEditorDispatch,
  useSelectedOverlay,
  type EditorOverlay,
} from "@/components/dashboard/editor/store";
import type { OverlayAnimation, OverlayPosition } from "@/lib/studio-productions/editor-dsl";

/**
 * OverlayInspector — S2 skeleton with text + time inputs. S5 expands
 * style editing (font, color, background) and animation picker UI.
 */
export function OverlayInspector() {
  const t = useTranslations("Dashboard.productions.editor");
  const overlay = useSelectedOverlay();
  const dispatch = useEditorDispatch();
  if (!overlay) return null;

  const update = (patch: Partial<EditorOverlay>) => {
    dispatch({ type: "updateOverlay", overlayId: overlay.id, patch });
  };

  const positionValue =
    typeof overlay.position === "string" ? overlay.position : "custom";

  const setPosition = (value: string) => {
    if (value === "top" || value === "center" || value === "bottom") {
      update({ position: value });
    } else if (value === "custom") {
      update({ position: { xPct: 50, yPct: 80 } });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("overlayInspectorTitle")}
        </h3>
        <button
          type="button"
          onClick={() =>
            dispatch({ type: "removeOverlay", overlayId: overlay.id })
          }
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-danger/30 text-danger hover:bg-danger/10"
          aria-label={t("overlayRemove")}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-text-secondary">
          {t("overlayText")}
        </span>
        <textarea
          value={overlay.text}
          maxLength={500}
          onChange={(e) => update({ text: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-border-subtle bg-field px-2 py-1.5 text-sm"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label={t("overlayStart")}
          value={overlay.startSec}
          min={0}
          max={600}
          step={0.1}
          onChange={(v) => update({ startSec: v })}
        />
        <NumberField
          label={t("overlayEnd")}
          value={overlay.endSec}
          min={overlay.startSec + 0.1}
          max={600}
          step={0.1}
          onChange={(v) => update({ endSec: v })}
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-text-secondary">
          {t("overlayPosition")}
        </span>
        <select
          value={positionValue}
          onChange={(e) => setPosition(e.target.value)}
          className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-sm"
        >
          <option value="top">{t("overlayPositionTop")}</option>
          <option value="center">{t("overlayPositionCenter")}</option>
          <option value="bottom">{t("overlayPositionBottom")}</option>
          <option value="custom">{t("overlayPositionCustom")}</option>
        </select>
        {positionValue === "custom" && typeof overlay.position === "object" ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField
              label={t("overlayPositionX")}
              value={(overlay.position as { xPct: number }).xPct}
              min={0}
              max={100}
              step={1}
              onChange={(v) =>
                update({
                  position: {
                    xPct: v,
                    yPct: (overlay.position as { yPct: number }).yPct,
                  } as OverlayPosition,
                })
              }
            />
            <NumberField
              label={t("overlayPositionY")}
              value={(overlay.position as { yPct: number }).yPct}
              min={0}
              max={100}
              step={1}
              onChange={(v) =>
                update({
                  position: {
                    xPct: (overlay.position as { xPct: number }).xPct,
                    yPct: v,
                  } as OverlayPosition,
                })
              }
            />
          </div>
        ) : null}
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-text-secondary">
            {t("overlayAnimation")}
          </span>
          <select
            value={overlay.animation}
            onChange={(e) =>
              update({ animation: e.target.value as OverlayAnimation })
            }
            className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-sm"
          >
            <option value="none">{t("overlayAnimationNone")}</option>
            <option value="fade_in">{t("overlayAnimationFade")}</option>
            <option value="slide_up">{t("overlayAnimationSlide")}</option>
          </select>
        </label>
        <NumberField
          label={t("overlayAnimationDuration")}
          value={overlay.animationDurationSec}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => update({ animationDurationSec: v })}
        />
      </div>

      <fieldset className="space-y-2 rounded-md border border-border-subtle bg-layer-02/40 p-3">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {t("overlayStyleTitle")}
        </legend>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-text-secondary">
            {t("overlayStyleFontFamily")}
          </span>
          <select
            value={overlay.style.fontFamily}
            onChange={(e) =>
              update({
                style: {
                  ...overlay.style,
                  fontFamily: e.target.value as "system" | "serif" | "mono",
                },
              })
            }
            className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-sm"
          >
            <option value="system">{t("overlayFontSystem")}</option>
            <option value="serif">{t("overlayFontSerif")}</option>
            <option value="mono">{t("overlayFontMono")}</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label={t("overlayStyleFontSize")}
            value={overlay.style.fontSize}
            min={12}
            max={200}
            step={2}
            onChange={(v) =>
              update({ style: { ...overlay.style, fontSize: v } })
            }
          />
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-text-secondary">
              {t("overlayStyleFontWeight")}
            </span>
            <select
              value={overlay.style.fontWeight}
              onChange={(e) =>
                update({
                  style: {
                    ...overlay.style,
                    fontWeight: Number(e.target.value) as 400 | 600 | 700,
                  },
                })
              }
              className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-sm"
            >
              <option value={400}>{t("overlayFontWeight400")}</option>
              <option value={600}>{t("overlayFontWeight600")}</option>
              <option value={700}>{t("overlayFontWeight700")}</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label={t("overlayStyleFontColor")}
            value={overlay.style.fontColor}
            onChange={(v) =>
              update({ style: { ...overlay.style, fontColor: v } })
            }
          />
          <ColorField
            label={t("overlayStyleBackground")}
            value={overlay.style.backgroundColor}
            onChange={(v) =>
              update({ style: { ...overlay.style, backgroundColor: v } })
            }
          />
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-text-secondary">
            {t("overlayStyleBackgroundOpacity", {
              pct: Math.round(overlay.style.backgroundOpacity * 100),
            })}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={overlay.style.backgroundOpacity}
            onChange={(e) =>
              update({
                style: {
                  ...overlay.style,
                  backgroundOpacity: Number(e.target.value),
                },
              })
            }
            className="w-full"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label={t("overlayStyleRadius")}
            value={overlay.style.borderRadius}
            min={0}
            max={48}
            step={1}
            onChange={(v) =>
              update({ style: { ...overlay.style, borderRadius: v } })
            }
          />
          <NumberField
            label={t("overlayStylePaddingX")}
            value={overlay.style.paddingX}
            min={0}
            max={64}
            step={1}
            onChange={(v) =>
              update({ style: { ...overlay.style, paddingX: v } })
            }
          />
          <NumberField
            label={t("overlayStylePaddingY")}
            value={overlay.style.paddingY}
            min={0}
            max={64}
            step={1}
            onChange={(v) =>
              update({ style: { ...overlay.style, paddingY: v } })
            }
          />
        </div>
      </fieldset>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-text-secondary">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border-subtle bg-field p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          className="h-9 flex-1 rounded-md border border-border-subtle bg-field px-2 font-mono text-[11px]"
        />
      </div>
    </label>
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
