"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  generatePackagingDraftFromEpisode,
  generateThumbnailImageFromEpisode,
  generateTimedScriptFromEpisode,
} from "@/actions/studio-pipeline-presteps";
import { generateTtsFromScript, generateSubtitlesFromAudio } from "@/actions/studio-tts";
import { renderEpisodeScenes } from "@/actions/studio-scene-render";
import { assembleEpisodeVideo } from "@/actions/studio-video-assembly";
import { uploadEpisodeToYouTube } from "@/actions/studio-youtube";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import { parsePackagingDraftContent } from "@/lib/studio-productions/packaging-draft";
import {
  OPENAI_DRAFT_MODEL_OPTIONS,
  ANTHROPIC_DRAFT_MODEL_OPTIONS,
  DEFAULT_PACKAGING_DRAFT_MODEL_ID,
} from "@/lib/studio-productions/episode-llm-models";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

type PipelineProps = {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  runwayRenderReady?: boolean;
  elevenlabsKeyConfigured?: boolean;
  packagingLlmReady?: boolean;
  /** OpenAI key saved — required for DALL·E thumbnail image step */
  openaiKeyConfigured?: boolean;
  className?: string;
};

type PipelineStepActionState = {
  ok?: boolean;
  error?: string;
} | null;

type ViewKind = "timed" | "packaging" | "thumbnail" | null;

function usePipelineStepToast(
  state: PipelineStepActionState,
  successKey: string,
  tProd: (key: string) => string,
  tAction: (key: string, values?: { max?: number }) => string,
  router: ReturnType<typeof useRouter>,
) {
  const handledStateRef = useRef<PipelineStepActionState>(null);

  useEffect(() => {
    if (!state || handledStateRef.current === state) return;
    handledStateRef.current = state;

    if (state.ok) {
      toast.success(tProd(successKey));
      router.refresh();
      return;
    }

    if (state.error) {
      toast.error(translateActionErrorMessage(state.error, tAction));
    }
  }, [router, state, successKey, tProd, tAction]);
}

function latestArtifact(
  artifacts: StudioProductionArtifactRow[],
  role: string,
): StudioProductionArtifactRow | null {
  const rows = artifacts.filter((a) => a.artifact_role === role);
  if (rows.length === 0) return null;
  return [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
}

export function ProductionEpisodePipeline({
  episodeId,
  artifacts,
  runwayRenderReady = false,
  elevenlabsKeyConfigured = false,
  packagingLlmReady = false,
  openaiKeyConfigured = false,
  className,
}: PipelineProps) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState<ViewKind>(null);

  const packagingModelOptions = useMemo(() => {
    const all = [
      ...OPENAI_DRAFT_MODEL_OPTIONS.map((o) => ({ id: o.id, label: `OpenAI · ${o.id} (${o.pricingHint})` })),
      ...ANTHROPIC_DRAFT_MODEL_OPTIONS.map((o) => ({ id: o.id, label: `Anthropic · ${o.id} (${o.pricingHint})` })),
    ];
    return all;
  }, []);

  const thumbnailModelOptions = useMemo(
    () => [
      { id: "dall-e-3", label: "DALL-E 3 (default)" },
      { id: "dall-e-2", label: "DALL-E 2 (faster, lower quality)" },
    ],
    [],
  );

  const hasDraftScript = artifacts.some(
    (a) => a.artifact_role === "script_draft" || a.artifact_role === "script",
  );
  const hasTimedScript = artifacts.some((a) => a.artifact_role === "timed_script");
  const hasPackagingDraft = artifacts.some(
    (a) => a.artifact_role === "packaging_draft",
  );
  const hasThumbnailImage = artifacts.some((a) => a.artifact_role === "thumbnail");
  const hasTtsAudio = artifacts.some((a) => a.artifact_role === "tts_audio");
  const hasSubtitleSrt = artifacts.some((a) => a.artifact_role === "subtitle_srt");
  const hasSceneClips = artifacts.some((a) => a.artifact_role === "scene_clip");
  const hasAssembledVideo = artifacts.some((a) => a.artifact_role === "assembled_video");

  const timedArtifact = useMemo(() => latestArtifact(artifacts, "timed_script"), [artifacts]);
  const packagingArtifact = useMemo(
    () => latestArtifact(artifacts, "packaging_draft"),
    [artifacts],
  );
  const thumbnailArtifact = useMemo(() => latestArtifact(artifacts, "thumbnail"), [artifacts]);

  const packagingParsed = useMemo(() => {
    const raw = packagingArtifact?.content_text ?? "";
    return parsePackagingDraftContent(raw);
  }, [packagingArtifact]);

  const scriptText = useMemo(() => {
    const scriptArt = artifacts.find(
      (a) => a.artifact_role === "script_draft" || a.artifact_role === "script",
    );
    return scriptArt?.content_text ?? "";
  }, [artifacts]);

  const ttsAudioUrl = useMemo(() => {
    const ttsArt = artifacts.find((a) => a.artifact_role === "tts_audio");
    return ttsArt?.external_url ?? "";
  }, [artifacts]);

  const [timedState, timedAction, timedPending] = useActionState(
    generateTimedScriptFromEpisode,
    null,
  );
  const [packState, packAction, packPending] = useActionState(
    generatePackagingDraftFromEpisode,
    null,
  );
  const [thumbState, thumbAction, thumbPending] = useActionState(
    generateThumbnailImageFromEpisode,
    null,
  );
  const [ttsState, ttsAction, ttsPending] = useActionState(
    generateTtsFromScript,
    null,
  );
  const [subState, subAction, subPending] = useActionState(
    generateSubtitlesFromAudio,
    null,
  );
  const [sceneState, sceneAction, scenePending] = useActionState(
    renderEpisodeScenes,
    null,
  );
  const [assemblyState, assemblyAction, assemblyPending] = useActionState(
    assembleEpisodeVideo,
    null,
  );
  const [ytState, ytAction, ytPending] = useActionState(
    uploadEpisodeToYouTube,
    null,
  );

  usePipelineStepToast(timedState, "draftPreprodTimedSuccess", t, tAction, router);
  usePipelineStepToast(packState, "draftPreprodPackagingSuccess", t, tAction, router);
  usePipelineStepToast(thumbState, "draftThumbnailImageSuccess", t, tAction, router);
  usePipelineStepToast(ttsState, "draftTtsSuccess", t, tAction, router);
  usePipelineStepToast(subState, "draftSubtitleSuccess", t, tAction, router);
  usePipelineStepToast(sceneState, "draftSceneRenderSuccess", t, tAction, router);
  usePipelineStepToast(assemblyState, "draftAssembleSuccess", t, tAction, router);
  usePipelineStepToast(ytState, "draftYoutubeSuccess", t, tAction, router);

  const ttsDisabled = !hasDraftScript || !elevenlabsKeyConfigured;
  const ttsHint = !hasDraftScript
    ? t("draftTtsNeedScriptHint")
    : !elevenlabsKeyConfigured
      ? t("draftTtsDisabledHint")
      : undefined;

  const timedDisabled = !hasDraftScript;
  const timedHint = !hasDraftScript
    ? t("draftPreprodTimedHintNoScript")
    : t("draftPreprodTimedHint");

  const packagingDisabled = !hasDraftScript || !packagingLlmReady;
  const packagingHint = !hasDraftScript
    ? t("draftPreprodPackagingHintNoScript")
    : !packagingLlmReady
      ? t("draftPreprodPackagingHintNoLlm")
      : t("draftPreprodPackagingHint");

  const thumbnailDisabled =
    !hasPackagingDraft || !openaiKeyConfigured || !packagingParsed?.thumbnail_image_prompt?.trim();
  const thumbnailHint = !hasPackagingDraft
    ? t("draftThumbnailImageHintNoPackaging")
    : !openaiKeyConfigured
      ? t("draftThumbnailImageHintNoOpenAi")
      : !packagingParsed?.thumbnail_image_prompt?.trim()
        ? t("draftThumbnailImageHintNoPrompt")
        : t("draftThumbnailImageHint");

  return (
    <div className={cn("flex flex-col gap-6 border-t border-border-subtle pt-5", className)}>
      <p className="text-sm text-text-secondary leading-relaxed max-w-prose -mt-1">
        {t("producePanelLead")}
      </p>

      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          {t("draftPreprodSectionTitle")}
        </h3>
        <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
          {t("draftPreprodSectionSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreprodInfoRow
          label={t("draftPreprodDraftStep")}
          done={hasDraftScript}
          hint={!hasDraftScript ? t("draftPreprodDraftHint") : undefined}
        />

        <PreprodPipelineStep
          step={1}
          label={t("draftPreprodTimedStep")}
          done={hasTimedScript}
          disabled={timedDisabled}
          hint={timedHint}
          pending={timedPending}
          formAction={timedAction}
          hiddenFields={{ episode_id: episodeId }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasTimedScript && Boolean(timedArtifact?.content_text?.trim())}
          onView={() => setViewOpen("timed")}
        />

        <PreprodPipelineStep
          step={2}
          label={t("draftPreprodPackagingStep")}
          done={hasPackagingDraft}
          disabled={packagingDisabled}
          hint={packagingHint}
          pending={packPending}
          formAction={packAction}
          hiddenFields={{ episode_id: episodeId }}
          fullWidth
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasPackagingDraft && Boolean(packagingParsed)}
          onView={() => setViewOpen("packaging")}
          modelOptions={packagingModelOptions}
          defaultModel={DEFAULT_PACKAGING_DRAFT_MODEL_ID}
          showCustomInstructions
        />

        <PreprodPipelineStep
          step={3}
          label={t("draftThumbnailImageStep")}
          done={hasThumbnailImage}
          disabled={thumbnailDisabled}
          hint={thumbnailHint}
          pending={thumbPending}
          formAction={thumbAction}
          hiddenFields={{ episode_id: episodeId }}
          fullWidth
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasThumbnailImage && Boolean(thumbnailArtifact?.external_url)}
          onView={() => setViewOpen("thumbnail")}
          modelOptions={thumbnailModelOptions}
          defaultModel="dall-e-3"
          showCustomInstructions
        />
      </div>

      {!packagingLlmReady && (
        <p className="text-[11px] text-text-tertiary max-w-prose leading-relaxed -mt-2">
          {t("draftPreprodPackagingHintNoLlm")}{" "}
          <Link
            href="/dashboard/productions?studio=integrations"
            className="font-medium text-primary hover:underline"
          >
            {t("draftRunwayIntegrationsLink")}
          </Link>
        </p>
      )}

      <Modal
        open={viewOpen === "timed"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalTimedTitle")}
        size="xl"
      >
        <pre className="max-h-[min(70vh,32rem)] overflow-auto whitespace-pre-wrap rounded-lg border border-border-subtle bg-layer-02/40 p-3 text-xs text-text-secondary leading-relaxed">
          {timedArtifact?.content_text?.trim() || "—"}
        </pre>
      </Modal>

      <Modal
        open={viewOpen === "packaging"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalPackagingTitle")}
        size="xl"
      >
        {packagingParsed ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t("pipelinePackagingYoutubeTitle")}
              </p>
              <p className="mt-1 text-text-primary whitespace-pre-wrap">
                {packagingParsed.youtube_title || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t("pipelinePackagingYoutubeDescription")}
              </p>
              <p className="mt-1 text-text-secondary whitespace-pre-wrap leading-relaxed">
                {packagingParsed.youtube_description || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t("pipelinePackagingThumbnailPrompt")}
              </p>
              <p className="mt-1 text-text-secondary whitespace-pre-wrap leading-relaxed">
                {packagingParsed.thumbnail_image_prompt || "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">{t("pipelineModalEmpty")}</p>
        )}
      </Modal>

      <Modal
        open={viewOpen === "thumbnail"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalThumbnailTitle")}
        description={t("pipelineModalThumbnailNote")}
        size="xl"
      >
        {thumbnailArtifact?.external_url ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI from DALL-E b64_json; no Image optimizer config */}
            <img
              src={thumbnailArtifact.external_url}
              alt=""
              className="w-full max-h-[min(70vh,28rem)] rounded-lg border border-border-subtle object-contain bg-black/5"
            />
            {thumbnailArtifact.content_text?.trim() ? (
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-border-subtle bg-layer-02/40 p-3 text-[11px] text-text-tertiary">
                {thumbnailArtifact.content_text}
              </pre>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">{t("pipelineModalEmpty")}</p>
        )}
      </Modal>

      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          {t("draftPipelineTitle")}
        </h3>
        <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
          {t("draftPipelineSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PipelineStep
          step={1}
          label={t("draftTtsCta")}
          done={hasTtsAudio}
          disabled={ttsDisabled}
          hint={ttsHint}
          pending={ttsPending}
          formAction={ttsAction}
          hiddenFields={{ episode_id: episodeId, script_text: scriptText }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
        />

        <PipelineStep
          step={2}
          label={t("draftSubtitleCta")}
          done={hasSubtitleSrt}
          disabled={!hasTtsAudio}
          hint={!hasTtsAudio ? t("draftSubtitleDisabledHint") : undefined}
          pending={subPending}
          formAction={subAction}
          hiddenFields={{ episode_id: episodeId, audio_url: ttsAudioUrl }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
        />

        <PipelineStep
          step={3}
          label={t("draftSceneRenderCta")}
          done={hasSceneClips}
          disabled={!hasDraftScript || !runwayRenderReady}
          hint={!runwayRenderReady ? t("draftRunwayDisabledHint") : undefined}
          pending={scenePending}
          formAction={sceneAction}
          hiddenFields={{ episode_id: episodeId, script_text: scriptText }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
        />

        <PipelineStep
          step={4}
          label={t("draftAssembleCta")}
          done={hasAssembledVideo}
          disabled={!hasSceneClips}
          hint={!hasSceneClips ? t("draftAssembleDisabledHint") : undefined}
          pending={assemblyPending}
          formAction={assemblyAction}
          hiddenFields={{ episode_id: episodeId }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
        />

        <PipelineStep
          step={5}
          label={t("draftYoutubeCta")}
          done={false}
          disabled={!hasAssembledVideo}
          hint={!hasAssembledVideo ? t("draftYoutubeDisabledHint") : undefined}
          pending={ytPending}
          formAction={ytAction}
          hiddenFields={{ episode_id: episodeId, privacy: "private" }}
          fullWidth
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
        />
      </div>

      {!elevenlabsKeyConfigured && (
        <p className="text-[11px] text-text-tertiary max-w-prose leading-relaxed">
          {t("draftTtsDisabledHint")}{" "}
          <Link
            href="/dashboard/productions?studio=integrations"
            className="font-medium text-primary hover:underline"
          >
            {t("draftRunwayIntegrationsLink")}
          </Link>
        </p>
      )}

      {!runwayRenderReady && (
        <p className="text-[11px] text-text-tertiary max-w-prose leading-relaxed">
          {t("draftRunwayDisabledHint")}{" "}
          <Link
            href="/dashboard/productions?studio=integrations"
            className="font-medium text-primary hover:underline"
          >
            {t("draftRunwayIntegrationsLink")}
          </Link>
        </p>
      )}
    </div>
  );
}

function PreprodInfoRow({
  label,
  done,
  hint,
}: {
  label: string;
  done: boolean;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3 sm:col-span-2",
        done
          ? "border-green-500/30 bg-green-500/5"
          : "border-border-subtle/50 bg-layer-02/20 opacity-80",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            done
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : "bg-layer-03 text-text-tertiary",
          )}
        >
          {done ? "\u2713" : "\u2022"}
        </span>
        <span className="text-xs font-medium text-text-primary truncate">{label}</span>
      </div>
      {hint && !done && (
        <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
          {hint}
        </p>
      )}
    </div>
  );
}

function PreprodPipelineStep({
  step,
  label,
  done,
  disabled,
  hint,
  pending,
  formAction,
  hiddenFields,
  fullWidth,
  runLabel,
  redoLabel,
  viewLabel,
  showView,
  onView,
  modelOptions,
  defaultModel,
  showCustomInstructions,
}: {
  step: number;
  label: string;
  done: boolean;
  disabled: boolean;
  hint?: string;
  pending: boolean;
  formAction: (payload: FormData) => void;
  hiddenFields: Record<string, string>;
  fullWidth?: boolean;
  runLabel: string;
  redoLabel: string;
  viewLabel: string;
  showView?: boolean;
  onView?: () => void;
  modelOptions?: Array<{ id: string; label: string }>;
  defaultModel?: string;
  showCustomInstructions?: boolean;
}) {
  const formId = useId();
  const [advOpen, setAdvOpen] = useState(false);
  const hasAdvanced = Boolean(modelOptions?.length || showCustomInstructions);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        done
          ? "border-green-500/30 bg-green-500/5"
          : disabled
            ? "border-border-subtle/50 bg-layer-02/20 opacity-60"
            : "border-border-subtle bg-layer-02/40",
        fullWidth && "sm:col-span-2",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              done
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-layer-03 text-text-tertiary",
            )}
          >
            {done ? "\u2713" : step}
          </span>
          <span className="text-xs font-medium text-text-primary truncate">
            {label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {hasAdvanced && !disabled ? (
            <button
              type="button"
              className="text-[10px] text-text-tertiary hover:text-text-secondary px-1"
              onClick={() => setAdvOpen((p) => !p)}
            >
              {advOpen ? "\u25B2" : "\u2699"}
            </button>
          ) : null}
          {showView && onView ? (
            <Button type="button" variant="secondary" size="sm" onClick={onView}>
              {viewLabel}
            </Button>
          ) : null}
          <form action={formAction} className="inline" id={formId}>
            {Object.entries(hiddenFields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            {advOpen && modelOptions?.length ? null : (
              <input type="hidden" name="model" value={defaultModel ?? ""} />
            )}
            {advOpen ? null : (
              <input type="hidden" name="custom_instructions" value="" />
            )}
            <Button
              type="submit"
              variant={done ? "secondary" : "ghost"}
              size="sm"
              isLoading={pending}
              disabled={disabled}
            >
              {done ? redoLabel : runLabel}
            </Button>
          </form>
        </div>
      </div>
      {hint && !done && (
        <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
          {hint}
        </p>
      )}
      {advOpen && hasAdvanced && !disabled ? (
        <div className="mt-2 pl-7 space-y-2 border-t border-border-subtle/50 pt-2">
          {modelOptions?.length ? (
            <div>
              <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                Model
              </label>
              <select
                name="model"
                form={formId}
                defaultValue={defaultModel}
                className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
              >
                {modelOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {showCustomInstructions ? (
            <div>
              <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                Custom instructions
              </label>
              <input
                name="custom_instructions"
                form={formId}
                maxLength={500}
                placeholder="e.g. Use a warmer tone, focus on curiosity..."
                className="h-7 w-full rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PipelineStep({
  step,
  label,
  done,
  disabled,
  hint,
  pending,
  formAction,
  hiddenFields,
  fullWidth,
  runLabel,
  redoLabel,
}: {
  step: number;
  label: string;
  done: boolean;
  disabled: boolean;
  hint?: string;
  pending: boolean;
  formAction: (payload: FormData) => void;
  hiddenFields: Record<string, string>;
  fullWidth?: boolean;
  runLabel: string;
  redoLabel: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        done
          ? "border-green-500/30 bg-green-500/5"
          : disabled
            ? "border-border-subtle/50 bg-layer-02/20 opacity-60"
            : "border-border-subtle bg-layer-02/40",
        fullWidth && "sm:col-span-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              done
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-layer-03 text-text-tertiary",
            )}
          >
            {done ? "\u2713" : step}
          </span>
          <span className="text-xs font-medium text-text-primary truncate">
            {label}
          </span>
        </div>
        <form action={formAction}>
          {Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <Button
            type="submit"
            variant={done ? "secondary" : "ghost"}
            size="sm"
            isLoading={pending}
            disabled={disabled}
          >
            {done ? redoLabel : runLabel}
          </Button>
        </form>
      </div>
      {hint && !done && (
        <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
          {hint}
        </p>
      )}
    </div>
  );
}
