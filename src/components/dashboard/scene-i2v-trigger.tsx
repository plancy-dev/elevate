"use client";

/**
 * Single-scene Runway image-to-video trigger — rendered beneath the scene
 * image gallery card when a First Frame is set. A Last Frame slot, if
 * present, is sent to the provider only when the chosen model supports it
 * (capability table in `runway-i2v-models.ts`).
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Film } from "lucide-react";
import { renderSceneWithI2V } from "@/actions/studio-scene-i2v";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import {
  DEFAULT_RUNWAY_I2V_MODEL,
  RUNWAY_I2V_MODEL_IDS,
  RUNWAY_I2V_MODELS,
  type RunwayI2VModelId,
} from "@/lib/studio-integrations/providers/runway/runway-i2v-models";
import { STUDIO_PROVIDER_DOCS } from "@/lib/studio-integrations/provider-docs";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";

export function SceneI2VTrigger({
  episodeId,
  sceneIndex,
  hasFirstFrame,
  hasLastFrame,
  canEdit,
}: {
  episodeId: string;
  sceneIndex: number;
  hasFirstFrame: boolean;
  hasLastFrame: boolean;
  canEdit: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();

  const [model, setModel] = useState<RunwayI2VModelId>(DEFAULT_RUNWAY_I2V_MODEL);
  const [hint, setHint] = useState("");
  const [pending, startTransition] = useTransition();

  const cap = RUNWAY_I2V_MODELS[model];
  const usesLastFrame = cap.supportsLastFrame && hasLastFrame;

  const disabled = !canEdit || !hasFirstFrame || pending;

  const runwayDocs = STUDIO_PROVIDER_DOCS.runway.apiDocsUrl;

  const handle = () => {
    const fd = new FormData();
    fd.set("episode_id", episodeId);
    fd.set("scene_index", String(sceneIndex));
    fd.set("model", model);
    if (!cap.supportsLastFrame && hint.trim()) {
      fd.set("end_state_hint", hint.trim());
    }
    startTransition(async () => {
      const result = await renderSceneWithI2V(null, fd);
      if (result?.ok) {
        toast.success(t("sceneI2vToastQueued"));
        router.refresh();
      } else if (result?.error) {
        toast.error(translateActionErrorMessage(result.error, tAction));
      }
    });
  };

  return (
    <div className="space-y-2 border border-ink-100 bg-paper-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 font-mono text-[11px] text-ink-600">
          <span>{t("sceneI2vModelLabel")}</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as RunwayI2VModelId)}
            disabled={pending}
            className="h-8 border-b border-ink-300 bg-transparent px-0 text-xs text-ink-900 outline-none focus:border-vermilion-600"
          >
            {RUNWAY_I2V_MODEL_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <span
          className={
            cap.supportsLastFrame
              ? "inline-flex items-center border border-vermilion-600/35 bg-paper-0 px-2 py-0.5 font-mono text-[10px] text-vermilion-600"
              : "inline-flex items-center border border-ink-100 bg-paper-100 px-2 py-0.5 font-mono text-[10px] text-ink-500"
          }
        >
          {cap.supportsLastFrame
            ? t("sceneI2vCapabilityFirstLast")
            : t("sceneI2vCapabilityFirstOnly")}
        </span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handle}
          isLoading={pending}
          disabled={disabled}
          className="inline-flex items-center gap-1.5"
        >
          <Film className="h-3.5 w-3.5" aria-hidden />
          {t("sceneI2vRunCta")}
        </Button>
        <a
          href={runwayDocs}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-vermilion-600 underline underline-offset-2 hover:opacity-90"
        >
          {t("sceneI2vDocsLink")}
        </a>
      </div>
      {!hasFirstFrame ? (
        <p className="font-mono text-[11px] text-vermilion-600">
          {t("sceneI2vFirstFrameRequired")}
        </p>
      ) : null}
      {!cap.supportsLastFrame && hasLastFrame ? (
        <p className="text-[11px] text-ink-500">
          {t("sceneI2vLastUnsupportedTip")}
        </p>
      ) : null}
      {!cap.supportsLastFrame ? (
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
            {t("sceneI2vEndHintLabel")}
          </span>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            maxLength={300}
            placeholder={t("sceneI2vEndHintPlaceholder")}
            className="h-8 w-full border-b border-ink-300 bg-transparent px-0 text-xs text-ink-900 outline-none focus:border-vermilion-600"
          />
        </label>
      ) : usesLastFrame ? (
        <p className="text-[11px] text-ink-500">
          {t("sceneI2vLastBoundHint")}
        </p>
      ) : null}
    </div>
  );
}
