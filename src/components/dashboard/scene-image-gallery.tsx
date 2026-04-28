"use client";

/**
 * Scene image gallery — Phase 1 (ADR-009 §3).
 *
 * Per-scene card with:
 *  - provider dropdown (Gemini / FLUX Replicate / FLUX fal.ai / Seedream)
 *  - Generate N candidates button
 *  - First Frame + Last Frame slots
 *  - Candidate grid with per-image "Set as first", "Set as last", "Delete"
 *
 * This is a thin client widget — data (scene rows, existing artifacts) comes
 * from the parent server component via props; mutations are done via server
 * actions in `@/actions/studio-scene-images`.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2, Star, Flag, ExternalLink } from "lucide-react";
import {
  clearSceneKeyframeSlot,
  deleteSceneKeyframe,
  generateSceneKeyframes,
  setSceneKeyframeSlot,
} from "@/actions/studio-scene-images";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import {
  STUDIO_IMAGE_PROVIDER_IDS,
  type StudioImageProviderId,
} from "@/lib/studio-integrations/types";
import { STUDIO_PROVIDER_DOCS } from "@/lib/studio-integrations/provider-docs";
import type { SceneKeyframeArtifact } from "@/lib/studio-productions/scene-keyframe-artifacts";
import type { SceneRow } from "@/lib/studio-productions/scene-rows-json";
import { SceneI2VTrigger } from "@/components/dashboard/scene-i2v-trigger";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

type SceneData = SceneRow & {
  first: SceneKeyframeArtifact | null;
  last: SceneKeyframeArtifact | null;
  candidates: SceneKeyframeArtifact[];
};

type Props = {
  episodeId: string;
  scenes: SceneData[];
  /** Providers with a saved key in the org integrations table. */
  availableProviders: StudioImageProviderId[];
  canEdit: boolean;
};

function providerLabel(id: StudioImageProviderId): string {
  switch (id) {
    case "google_gemini":
      return "Gemini (Nano Banana 2)";
    case "flux_replicate":
      return "FLUX (Replicate)";
    case "flux_fal":
      return "FLUX (fal.ai)";
    case "seedream":
      return "Seedream";
  }
}

export function SceneImageGallery({
  episodeId,
  scenes,
  availableProviders,
  canEdit,
}: Props) {
  const t = useTranslations("Dashboard.productions");

  if (scenes.length === 0) {
    return (
      <p className="text-xs text-ink-500">
        {t("sceneKeyframeGalleryEmpty")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!canEdit ? (
        <p className="border border-ink-100 bg-paper-100 px-3 py-2 text-xs text-ink-700">
          {t("sceneKeyframeReadOnly")}
        </p>
      ) : null}
      {availableProviders.length === 0 ? (
        <p className="border border-vermilion-600/40 bg-vermilion-100/40 px-3 py-2 text-xs text-vermilion-600">
          {t("sceneKeyframeNoProviderKey")}
        </p>
      ) : null}

      {scenes.map((scene) => (
        <SceneCard
          key={scene.index}
          episodeId={episodeId}
          scene={scene}
          availableProviders={availableProviders}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

function SceneCard({
  episodeId,
  scene,
  availableProviders,
  canEdit,
}: {
  episodeId: string;
  scene: SceneData;
  availableProviders: StudioImageProviderId[];
  canEdit: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();

  const [provider, setProvider] = useState<StudioImageProviderId>(() =>
    availableProviders[0] ?? "google_gemini",
  );
  const [count, setCount] = useState<number>(4);
  const [generating, startGenerate] = useTransition();
  const [, startSet] = useTransition();
  const [, startClear] = useTransition();
  const [, startDelete] = useTransition();

  const canGenerate = canEdit && availableProviders.length > 0;

  const handleGenerate = () => {
    const fd = new FormData();
    fd.set("episode_id", episodeId);
    fd.set("scene_index", String(scene.index));
    fd.set("provider", provider);
    fd.set("count", String(count));
    startGenerate(async () => {
      const result = await generateSceneKeyframes(null, fd);
      if (result?.ok) {
        toast.success(
          t("sceneKeyframeGenerateSuccess", { count: result.generatedCount ?? 0 }),
        );
        router.refresh();
      } else if (result?.error) {
        toast.error(translateActionErrorMessage(result.error, tAction));
      }
    });
  };

  const handleSetSlot = (artifactId: string, slot: "first" | "last") => {
    const fd = new FormData();
    fd.set("artifact_id", artifactId);
    fd.set("slot", slot);
    startSet(async () => {
      const result = await setSceneKeyframeSlot(null, fd);
      if (result?.ok) {
        toast.success(
          slot === "first"
            ? t("sceneKeyframeSetFirstToast")
            : t("sceneKeyframeSetLastToast"),
        );
        router.refresh();
      } else if (result?.error) {
        toast.error(translateActionErrorMessage(result.error, tAction));
      }
    });
  };

  const handleClearSlot = (artifactId: string) => {
    const fd = new FormData();
    fd.set("artifact_id", artifactId);
    startClear(async () => {
      const result = await clearSceneKeyframeSlot(null, fd);
      if (result?.ok) router.refresh();
      else if (result?.error)
        toast.error(translateActionErrorMessage(result.error, tAction));
    });
  };

  const handleDelete = (artifactId: string) => {
    if (!window.confirm(t("sceneKeyframeDeleteConfirm"))) return;
    const fd = new FormData();
    fd.set("artifact_id", artifactId);
    startDelete(async () => {
      const result = await deleteSceneKeyframe(null, fd);
      if (result?.ok) router.refresh();
      else if (result?.error)
        toast.error(translateActionErrorMessage(result.error, tAction));
    });
  };

  const bothFramesSelected = !!scene.first && !!scene.last;

  return (
    <section className="space-y-3 border border-ink-100 bg-paper-100 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-ink-900">
            {t("sceneKeyframeSceneTitle", { index: scene.index + 1 })}
          </p>
          <p className="text-[11px] text-ink-500">
            {scene.narration.slice(0, 140)}
            {scene.narration.length > 140 ? "…" : ""}
          </p>
        </div>
        {bothFramesSelected ? (
          <span className="inline-flex items-center gap-1 border border-vermilion-600/35 bg-paper-0 px-2 py-0.5 font-mono text-[10px] text-vermilion-600">
            <Star className="h-3 w-3" aria-hidden />
            {t("sceneKeyframeReadyBadge")}
          </span>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FrameSlot
          label={t("sceneKeyframeSlotFirst")}
          artifact={scene.first}
          onClear={(id) => handleClearSlot(id)}
          canEdit={canEdit}
        />
        <FrameSlot
          label={t("sceneKeyframeSlotLast")}
          artifact={scene.last}
          onClear={(id) => handleClearSlot(id)}
          canEdit={canEdit}
        />
      </div>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
          <label className="flex items-center gap-1.5 font-mono text-[11px] text-ink-600">
            <span>{t("sceneKeyframeProviderLabel")}</span>
            <select
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as StudioImageProviderId)
              }
              disabled={generating || !canGenerate}
              className="h-8 border-b border-ink-300 bg-transparent px-0 text-xs text-ink-900 outline-none focus:border-vermilion-600"
            >
              {STUDIO_IMAGE_PROVIDER_IDS.map((id) => {
                const disabled = !availableProviders.includes(id);
                return (
                  <option key={id} value={id} disabled={disabled}>
                    {providerLabel(id)}
                    {disabled ? t("sceneKeyframeProviderNoKey") : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="flex items-center gap-1.5 font-mono text-[11px] text-ink-600">
            <span>{t("sceneKeyframeCountLabel")}</span>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={generating || !canGenerate}
              className="h-8 border-b border-ink-300 bg-transparent px-0 text-xs text-ink-900 outline-none focus:border-vermilion-600"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            isLoading={generating}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("sceneKeyframeGenerateCta")}
          </Button>
          <a
            href={STUDIO_PROVIDER_DOCS[provider].apiDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-vermilion-600 underline underline-offset-2 hover:opacity-90"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {t("sceneKeyframeProviderDocsLink")}
          </a>
        </div>
      ) : null}

      {scene.candidates.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {scene.candidates.map((art) => (
            <Candidate
              key={art.id}
              art={art}
              onSetFirst={() => handleSetSlot(art.id, "first")}
              onSetLast={() => handleSetSlot(art.id, "last")}
              onDelete={() => handleDelete(art.id)}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-ink-500">
          {t("sceneKeyframeCandidatesEmpty")}
        </p>
      )}

      {scene.first ? (
        <SceneI2VTrigger
          episodeId={episodeId}
          sceneIndex={scene.index}
          hasFirstFrame
          hasLastFrame={!!scene.last}
          canEdit={canEdit}
        />
      ) : null}
    </section>
  );
}

function FrameSlot({
  label,
  artifact,
  onClear,
  canEdit,
}: {
  label: string;
  artifact: SceneKeyframeArtifact | null;
  onClear: (id: string) => void;
  canEdit: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  return (
    <div className="border border-ink-100 bg-paper-50 p-2">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-500">
        {label}
      </p>
      {artifact?.externalUrl ? (
        <div className="flex items-start gap-2">
          <Image
            src={artifact.externalUrl}
            alt={label}
            width={128}
            height={128}
            unoptimized
            className="h-24 w-24 border border-ink-100 object-cover"
          />
          {canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onClear(artifact.id)}
              className="text-[10px]"
            >
              {t("sceneKeyframeSlotClear")}
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-[11px] text-ink-500">
          {t("sceneKeyframeSlotEmpty")}
        </p>
      )}
    </div>
  );
}

function Candidate({
  art,
  onSetFirst,
  onSetLast,
  onDelete,
  canEdit,
}: {
  art: SceneKeyframeArtifact;
  onSetFirst: () => void;
  onSetLast: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  const [hover, setHover] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHover(false);
      }
    };
    if (hover) {
      window.addEventListener("mousedown", onDown);
      return () => window.removeEventListener("mousedown", onDown);
    }
    return undefined;
  }, [hover]);

  return (
    <div
      ref={menuRef}
      className={cn(
        "group relative aspect-square overflow-hidden border border-ink-100 bg-paper-50",
        !art.metadata.watermark_free
          ? "border-vermilion-600/40"
          : "",
      )}
    >
      {art.externalUrl ? (
        <Image
          src={art.externalUrl}
          alt={`scene ${art.metadata.scene_index + 1}`}
          width={256}
          height={256}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : null}
      {!art.metadata.watermark_free ? (
        <span className="absolute top-1 left-1 border border-vermilion-600/40 bg-paper-0 px-1.5 py-0.5 font-mono text-[9px] text-vermilion-600">
          {t("sceneKeyframeWatermarkBadge")}
        </span>
      ) : null}
      {canEdit ? (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-between gap-1 bg-ink-900/55 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="pointer-events-auto flex gap-1">
            <button
              type="button"
              onClick={onSetFirst}
              title={t("sceneKeyframeSetFirst")}
              className="border border-ink-100 bg-paper-0 p-1 text-ink-700 hover:text-ink-900"
              aria-label={t("sceneKeyframeSetFirst")}
            >
              <Flag className="h-3 w-3" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onSetLast}
              title={t("sceneKeyframeSetLast")}
              className="border border-ink-100 bg-paper-0 p-1 text-ink-700 hover:text-ink-900"
              aria-label={t("sceneKeyframeSetLast")}
            >
              <Star className="h-3 w-3" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={onDelete}
            title={t("sceneKeyframeDelete")}
            className="pointer-events-auto border border-vermilion-600 bg-paper-0 p-1 text-vermilion-600"
            aria-label={t("sceneKeyframeDelete")}
          >
            <Trash2 className="h-3 w-3" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
