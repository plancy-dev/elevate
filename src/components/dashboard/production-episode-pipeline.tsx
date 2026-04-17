"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Eye, ListChecks, Play, RotateCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { EpisodeDraftWorkbench } from "@/components/dashboard/episode-draft-workbench";
import { ProductionEpisodeReferencePanel } from "@/components/dashboard/production-episode-reference-panel";
import { PipelineReferenceSourcesStrip } from "@/components/dashboard/pipeline-reference-sources-strip";
import { PipelineStepAdvancedToggle } from "@/components/dashboard/pipeline-step-advanced-toggle";
import { YoutubeUploadPipelineStep } from "@/components/dashboard/youtube-upload-pipeline-step";
import type { StudioEpisodeDraftTemplateRow } from "@/lib/data/studio-draft-templates";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import type { StudioEpisodeDraftSnapshotRow } from "@/lib/studio-productions/draft-snapshots";
import { parsePackagingDraftContent } from "@/lib/studio-productions/packaging-draft";
import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";
import {
  OPENAI_DRAFT_MODEL_OPTIONS,
  ANTHROPIC_DRAFT_MODEL_OPTIONS,
  DEFAULT_PACKAGING_DRAFT_MODEL_ID,
  TIMED_SCRIPT_HEURISTIC_MODEL_ID,
} from "@/lib/studio-productions/episode-llm-models";
import { SCENES_JSON_INPUT_PLACEHOLDER } from "@/lib/studio-productions/scenes-json-placeholder";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

import {
  ELEVENLABS_LANGUAGE_SELECT_OPTIONS,
  appLocaleToElevenLabsLanguage,
} from "@/lib/studio-productions/elevenlabs-tts-presets";

type PipelineProps = {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  runwayRenderReady?: boolean;
  elevenlabsKeyConfigured?: boolean;
  packagingLlmReady?: boolean;
  /** OpenAI key saved — required for DALL·E thumbnail image step */
  openaiKeyConfigured?: boolean;
  /** Episode published URL after YouTube upload (marks upload step complete). */
  publishUrl?: string | null;
  /** Episode display title (fallback when packaging has no YouTube title). */
  episodeTitle?: string;
  /** OAuth-connected channel title (upload target). */
  youtubeChannelTitle?: string | null;
  episodeFormat?: EpisodeFormat;
  /** Planning / linked channel label (may differ from OAuth upload target). */
  distributionChannelLabel?: string | null;
  className?: string;
  /** Draft dialog + pipeline step edit (default true). */
  canEditDraft?: boolean;
  customDraftTemplates?: StudioEpisodeDraftTemplateRow[];
  draftLlmAvailability?: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots?: StudioEpisodeDraftSnapshotRow[];
};

type PipelineStepActionState = {
  ok?: boolean;
  error?: string;
  /** Optional provider detail (e.g. ElevenLabs status + response body). */
  errorDetail?: string;
} | null;

type ViewKind =
  | "timed"
  | "packaging"
  | "thumbnail"
  | "tts"
  | "subtitle"
  | "scene"
  | "assembly"
  | null;

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
      const msg = translateActionErrorMessage(state.error, tAction);
      const detail = state.errorDetail?.trim();
      if (detail) {
        toast.error(msg, { description: detail });
      } else {
        toast.error(msg);
      }
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
  publishUrl = null,
  episodeTitle = "",
  youtubeChannelTitle = null,
  episodeFormat = "shorts",
  distributionChannelLabel = null,
  className,
  canEditDraft = true,
  customDraftTemplates = [],
  draftLlmAvailability = null,
  draftSnapshots = [],
}: PipelineProps) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const locale = useLocale();
  const draftModalTitleId = useId();
  const draftCloseConfirmTitleId = useId();
  const pipelineProgressTitleId = useId();
  const referencesModalTitleId = useId();
  const defaultTtsLanguage = useMemo(
    () => appLocaleToElevenLabsLanguage(locale),
    [locale],
  );
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState<ViewKind>(null);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftCloseConfirmOpen, setDraftCloseConfirmOpen] = useState(false);
  const [referencesDialogOpen, setReferencesDialogOpen] = useState(false);
  const [draftPipelinePrefill, setDraftPipelinePrefill] = useState<{
    modelId: string;
    briefing: string;
  } | null>(null);
  const [draftPrefillNonce, setDraftPrefillNonce] = useState(0);
  const [ttsVoicePreset, setTtsVoicePreset] = useState<"female" | "male" | "custom">(
    "female",
  );

  const packagingModelOptions = useMemo(() => {
    const openai = OPENAI_DRAFT_MODEL_OPTIONS.map((o) => ({
      id: o.id,
      label: `OpenAI · ${o.id} (${o.pricingHint})`,
    }));
    const anthropic = ANTHROPIC_DRAFT_MODEL_OPTIONS.map((o) => ({
      id: o.id,
      label: `Anthropic · ${o.id} (${o.pricingHint})`,
    }));
    const defaultId = DEFAULT_PACKAGING_DRAFT_MODEL_ID;
    const head = anthropic.filter((o) => o.id === defaultId);
    const tailAnth = anthropic.filter((o) => o.id !== defaultId);
    return [...head, ...tailAnth, ...openai];
  }, []);

  const thumbnailModelOptions = useMemo(
    () => [
      { id: "dall-e-3", label: "DALL-E 3 (default)" },
      { id: "dall-e-2", label: "DALL-E 2 (faster, lower quality)" },
    ],
    [],
  );

  const timedModelOptions = useMemo(() => {
    const heuristic = [
      {
        id: TIMED_SCRIPT_HEURISTIC_MODEL_ID,
        label: t("pipelineTimedModelHeuristic"),
      },
    ];
    return [...heuristic, ...packagingModelOptions];
  }, [t, packagingModelOptions]);

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
  const ttsArtifact = useMemo(() => latestArtifact(artifacts, "tts_audio"), [artifacts]);
  const subtitleArtifact = useMemo(() => latestArtifact(artifacts, "subtitle_srt"), [artifacts]);
  const assemblyArtifact = useMemo(() => latestArtifact(artifacts, "assembled_video"), [artifacts]);
  const sceneClips = useMemo(() => {
    return [...artifacts]
      .filter((a) => a.artifact_role === "scene_clip")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [artifacts]);

  const elevenlabsTtsModelOptions = useMemo(
    () => [
      { id: "eleven_multilingual_v3", label: t("pipelineProduceTtsModelMultilingualV3") },
      { id: "eleven_multilingual_v2", label: t("pipelineProduceTtsModelMultilingualV2") },
      { id: "eleven_turbo_v2_5", label: t("pipelineProduceTtsModelTurboV25") },
      { id: "eleven_flash_v2_5", label: t("pipelineProduceTtsModelFlashV25") },
    ],
    [t],
  );

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

  const hasYoutubePublish = Boolean(publishUrl?.trim());

  const pipelineCompletedCount = useMemo(() => {
    return [
      hasTimedScript,
      hasPackagingDraft,
      hasThumbnailImage,
      hasTtsAudio,
      hasSubtitleSrt,
      hasSceneClips,
      hasAssembledVideo,
      hasYoutubePublish,
    ].filter(Boolean).length;
  }, [
    hasTimedScript,
    hasPackagingDraft,
    hasThumbnailImage,
    hasTtsAudio,
    hasSubtitleSrt,
    hasSceneClips,
    hasAssembledVideo,
    hasYoutubePublish,
  ]);

  const pipelineNextLabel = useMemo(() => {
    if (!hasDraftScript) return t("pipelineNextNeedDraft");
    if (!hasTimedScript) return t("draftPreprodTimedStep");
    if (!hasPackagingDraft) return t("draftPreprodPackagingStep");
    if (!hasThumbnailImage) return t("draftThumbnailImageStep");
    if (!hasTtsAudio) return t("draftTtsCta");
    if (!hasSubtitleSrt) return t("draftSubtitleCta");
    if (!hasSceneClips) return t("draftSceneRenderCta");
    if (!hasAssembledVideo) return t("draftAssembleCta");
    if (!hasYoutubePublish) return t("draftYoutubeCta");
    return null;
  }, [
    hasDraftScript,
    hasTimedScript,
    hasPackagingDraft,
    hasThumbnailImage,
    hasTtsAudio,
    hasSubtitleSrt,
    hasSceneClips,
    hasAssembledVideo,
    hasYoutubePublish,
    t,
  ]);

  const PIPELINE_TOTAL_STEPS = 8;

  return (
    <div className={cn("flex flex-col gap-6 border-t border-border-subtle pt-5", className)}>
      <p className="text-sm text-text-secondary leading-relaxed max-w-prose -mt-1">
        {t("producePanelLead")}
      </p>

      <section
        className="rounded-xl border border-border-subtle/90 bg-gradient-to-b from-layer-02/55 to-layer-02/30 px-3 py-3 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
        aria-labelledby={pipelineProgressTitleId}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
            aria-hidden
          >
            <ListChecks className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1">
              <p
                id={pipelineProgressTitleId}
                className="text-xs font-semibold text-text-primary"
              >
                {t("draftPipelineTitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1">
              <p className="text-[11px] font-medium text-text-primary">
                {t("pipelineProgressLabel", {
                  completed: pipelineCompletedCount,
                  total: PIPELINE_TOTAL_STEPS,
                })}
              </p>
              <p className="text-[11px] text-text-tertiary">
                {pipelineNextLabel
                  ? t("pipelineNextUpLabel", { step: pipelineNextLabel })
                  : t("pipelineAllComplete")}
              </p>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-layer-03"
              role="progressbar"
              aria-valuenow={pipelineCompletedCount}
              aria-valuemin={0}
              aria-valuemax={PIPELINE_TOTAL_STEPS}
              aria-label={t("pipelineProgressLabel", {
                completed: pipelineCompletedCount,
                total: PIPELINE_TOTAL_STEPS,
              })}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/90 to-primary/75 transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.min(100, (pipelineCompletedCount / PIPELINE_TOTAL_STEPS) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <PipelineReferenceSourcesStrip
        artifacts={artifacts}
        onOpenReferences={() => setReferencesDialogOpen(true)}
      />

      <div className="border-l-2 border-primary/45 pl-3">
        <h3 className="text-sm font-semibold tracking-tight text-text-primary">
          {t("pipelinePhasePrepareTitle")}
        </h3>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
          {t("pipelinePhasePrepareSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreprodPipelineStep
          key={`preprod-draft-${episodeId}-${DEFAULT_PACKAGING_DRAFT_MODEL_ID}`}
          step={0}
          label={t("draftPreprodDraftStep")}
          done={hasDraftScript}
          disabled={!canEditDraft}
          hint={!hasDraftScript ? t("draftPreprodDraftHint") : undefined}
          pending={false}
          formAction={async () => {}}
          hiddenFields={{}}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          modelOptions={packagingModelOptions}
          defaultModel={DEFAULT_PACKAGING_DRAFT_MODEL_ID}
          showCustomInstructions
          draftInteractive={{
            canUse: canEditDraft,
            showView: hasDraftScript,
            onPrimary: ({ modelId, customInstructions }) => {
              setDraftPipelinePrefill({
                modelId,
                briefing: customInstructions,
              });
              setDraftPrefillNonce((n) => n + 1);
              setDraftDirty(false);
              setDraftDialogOpen(true);
            },
            onView: () => {
              setDraftPipelinePrefill(null);
              setDraftPrefillNonce((n) => n + 1);
              setDraftDirty(false);
              setDraftDialogOpen(true);
            },
          }}
        />

        <PreprodPipelineStep
          key={`preprod-s1-${episodeId}-${TIMED_SCRIPT_HEURISTIC_MODEL_ID}`}
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
          modelOptions={timedModelOptions}
          defaultModel={TIMED_SCRIPT_HEURISTIC_MODEL_ID}
          showCustomInstructions
        />

        <PreprodPipelineStep
          key={`preprod-s2-${episodeId}-${DEFAULT_PACKAGING_DRAFT_MODEL_ID}`}
          step={2}
          label={t("draftPreprodPackagingStep")}
          done={hasPackagingDraft}
          disabled={packagingDisabled}
          hint={packagingHint}
          pending={packPending}
          formAction={packAction}
          hiddenFields={{ episode_id: episodeId }}
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
          key={`preprod-s3-${episodeId}-dall-e-3`}
          step={3}
          label={t("draftThumbnailImageStep")}
          done={hasThumbnailImage}
          disabled={thumbnailDisabled}
          hint={thumbnailHint}
          pending={thumbPending}
          formAction={thumbAction}
          hiddenFields={{ episode_id: episodeId }}
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
        open={draftDialogOpen && canEditDraft}
        onClose={() => {
          if (draftCloseConfirmOpen) return;
          if (draftDirty) setDraftCloseConfirmOpen(true);
          else setDraftDialogOpen(false);
        }}
        title={t("pipelineDraftDialogTitle")}
        description={t("pipelineDraftDialogDescription")}
        size="2xl"
        titleId={draftModalTitleId}
      >
        {draftDialogOpen && canEditDraft ? (
          <EpisodeDraftWorkbench
            variant="dialog"
            episodeId={episodeId}
            artifacts={artifacts}
            customDraftTemplates={customDraftTemplates}
            draftLlmAvailability={draftLlmAvailability}
            draftSnapshots={draftSnapshots}
            scriptTextareaRows={10}
            onDirtyChange={setDraftDirty}
            pipelineShortcutPrefill={draftPipelinePrefill}
            pipelineShortcutNonce={draftPrefillNonce}
            footerSlot={
              <p className="pt-3 text-xs text-text-tertiary border-t border-border-subtle">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setDraftDialogOpen(false);
                    setReferencesDialogOpen(true);
                  }}
                >
                  {t("pipelineDraftDialogFullWorkbenchLink")}
                </button>
              </p>
            }
          />
        ) : null}
      </Modal>

      <Modal
        open={draftCloseConfirmOpen}
        onClose={() => setDraftCloseConfirmOpen(false)}
        title={t("pipelineDraftCloseConfirmTitle")}
        description={t("pipelineDraftCloseConfirmDescription")}
        size="md"
        stackClassName="z-[90]"
        titleId={draftCloseConfirmTitleId}
      >
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => setDraftCloseConfirmOpen(false)}>
            {t("pipelineDraftCloseConfirmCancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setDraftCloseConfirmOpen(false);
              setDraftDialogOpen(false);
            }}
          >
            {t("pipelineDraftCloseConfirmDiscard")}
          </Button>
        </div>
      </Modal>

      <Modal
        open={referencesDialogOpen}
        onClose={() => setReferencesDialogOpen(false)}
        title={t("episodePanelHeadReferences")}
        description={t("episodePanelBodyReferences")}
        size="2xl"
        titleId={referencesModalTitleId}
        stackClassName="z-[82]"
      >
        <ProductionEpisodeReferencePanel
          episodeId={episodeId}
          artifacts={artifacts}
          omitSectionHeader
          className="border-0 pt-0"
        />
      </Modal>

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

      <Modal
        open={viewOpen === "tts"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalTtsTitle")}
        description={t("pipelineModalTtsDescription")}
        size="xl"
      >
        {ttsArtifact?.external_url ? (
          <div className="space-y-3">
            <audio
              controls
              src={ttsArtifact.external_url}
              className="w-full max-w-md"
            >
              <track kind="captions" />
            </audio>
            {ttsArtifact.content_text?.trim() ? (
              <pre className="max-h-[min(50vh,24rem)] overflow-auto whitespace-pre-wrap rounded-lg border border-border-subtle bg-layer-02/40 p-3 text-xs text-text-secondary leading-relaxed">
                {ttsArtifact.content_text}
              </pre>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">{t("pipelineModalEmpty")}</p>
        )}
      </Modal>

      <Modal
        open={viewOpen === "subtitle"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalSubtitleTitle")}
        size="xl"
      >
        {subtitleArtifact?.content_text?.trim() ? (
          <pre className="max-h-[min(70vh,32rem)] overflow-auto whitespace-pre-wrap rounded-lg border border-border-subtle bg-layer-02/40 p-3 text-xs text-text-secondary leading-relaxed font-mono">
            {subtitleArtifact.content_text}
          </pre>
        ) : (
          <p className="text-sm text-text-tertiary">{t("pipelineModalEmpty")}</p>
        )}
      </Modal>

      <Modal
        open={viewOpen === "scene"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalSceneTitle")}
        size="xl"
      >
        {sceneClips.length > 0 ? (
          <ul className="space-y-4 max-h-[min(70vh,36rem)] overflow-y-auto pr-1">
            {sceneClips.map((clip, idx) => (
              <li
                key={clip.id}
                className="rounded-lg border border-border-subtle bg-layer-02/30 p-3"
              >
                <p className="text-[10px] font-medium text-text-tertiary mb-2">
                  {t("pipelineModalSceneClipLabel", {
                    index: idx + 1,
                  })}
                </p>
                {clip.external_url?.startsWith("http") ? (
                  <video
                    src={clip.external_url}
                    controls
                    className="w-full max-h-48 rounded-md border border-border-subtle bg-black/40"
                  >
                    <track kind="captions" />
                  </video>
                ) : clip.external_url ? (
                  <p className="text-xs text-text-tertiary break-all">{clip.external_url}</p>
                ) : null}
                {clip.content_text?.trim() ? (
                  <p className="mt-2 text-xs text-text-secondary whitespace-pre-wrap line-clamp-4">
                    {clip.content_text}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-tertiary">{t("pipelineModalEmpty")}</p>
        )}
      </Modal>

      <Modal
        open={viewOpen === "assembly"}
        onClose={() => setViewOpen(null)}
        title={t("pipelineModalAssemblyTitle")}
        size="xl"
      >
        {assemblyArtifact?.external_url ? (
          <div className="space-y-3">
            {assemblyArtifact.external_url.startsWith("data:video") ||
            assemblyArtifact.external_url.startsWith("http") ? (
              <video
                src={assemblyArtifact.external_url}
                controls
                className="w-full max-h-[min(70vh,28rem)] rounded-lg border border-border-subtle bg-black/40"
              >
                <track kind="captions" />
              </video>
            ) : (
              <p className="text-xs text-text-tertiary break-all">{assemblyArtifact.external_url}</p>
            )}
            {assemblyArtifact.content_text?.trim() ? (
              <p className="text-sm text-text-secondary">{assemblyArtifact.content_text}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">{t("pipelineModalEmpty")}</p>
        )}
      </Modal>

      <div className="border-l-2 border-primary/45 pl-3">
        <h3 className="text-sm font-semibold tracking-tight text-text-primary">
          {t("pipelinePhaseProduceTitle")}
        </h3>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
          {t("pipelinePhaseProduceSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreprodPipelineStep
          key={`produce-tts-${episodeId}`}
          step={4}
          label={t("draftTtsCta")}
          done={hasTtsAudio}
          disabled={ttsDisabled}
          hint={ttsHint}
          pending={ttsPending}
          formAction={ttsAction}
          hiddenFields={{ episode_id: episodeId, script_text: scriptText }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasTtsAudio && Boolean(ttsAudioUrl)}
          onView={() => setViewOpen("tts")}
          modelOptions={elevenlabsTtsModelOptions}
          defaultModel="eleven_multilingual_v3"
          modelFieldName="model_id"
          showCustomInstructions={false}
          renderAdvancedExtra={(formId) => (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceVoicePresetLabel")}
                </label>
                <select
                  name="voice_preset"
                  form={formId}
                  value={ttsVoicePreset}
                  onChange={(e) =>
                    setTtsVoicePreset(e.target.value as "female" | "male" | "custom")
                  }
                  className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                >
                  <option value="female">{t("pipelineProduceVoicePresetFemale")}</option>
                  <option value="male">{t("pipelineProduceVoicePresetMale")}</option>
                  <option value="custom">{t("pipelineProduceVoicePresetCustom")}</option>
                </select>
              </div>
              {ttsVoicePreset === "custom" ? (
                <div>
                  <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                    {t("pipelineProduceVoiceIdLabel")}
                  </label>
                  <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
                    {t("pipelineProduceVoiceIdHintCustom")}
                  </p>
                  <input
                    name="voice_id"
                    form={formId}
                    maxLength={64}
                    placeholder="21m00Tcm4TlvDq8ikWAM"
                    className="h-7 w-full max-w-md rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary placeholder:text-text-tertiary"
                  />
                </div>
              ) : null}
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceLanguageLabel")}
                </label>
                <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
                  {t("pipelineProduceLanguageHint")}
                </p>
                <select
                  name="language"
                  form={formId}
                  defaultValue={defaultTtsLanguage}
                  className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                >
                  {ELEVENLABS_LANGUAGE_SELECT_OPTIONS.map((o) => (
                    <option key={o.value || "auto"} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                    {t("pipelineProduceTtsStabilityLabel")}
                  </label>
                  <input
                    name="tts_stability"
                    form={formId}
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={0.5}
                    className="h-7 w-full rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                    {t("pipelineProduceTtsSimilarityLabel")}
                  </label>
                  <input
                    name="tts_similarity"
                    form={formId}
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={0.75}
                    className="h-7 w-full rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceTtsStyleLabel")}
                </label>
                <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
                  {t("pipelineProduceTtsStyleHint")}
                </p>
                <input
                  name="tts_style"
                  form={formId}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  placeholder={t("pipelineProduceTtsStylePlaceholder")}
                  className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceTtsSpeakerBoostLabel")}
                </label>
                <select
                  name="tts_speaker_boost"
                  form={formId}
                  defaultValue=""
                  className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                >
                  <option value="">{t("pipelineProduceTtsSpeakerBoostDefault")}</option>
                  <option value="1">{t("pipelineProduceTtsSpeakerBoostOn")}</option>
                  <option value="0">{t("pipelineProduceTtsSpeakerBoostOff")}</option>
                </select>
              </div>
            </div>
          )}
        />

        <PreprodPipelineStep
          key={`produce-sub-${episodeId}`}
          step={5}
          label={t("draftSubtitleCta")}
          done={hasSubtitleSrt}
          disabled={!hasTtsAudio}
          hint={!hasTtsAudio ? t("draftSubtitleDisabledHint") : undefined}
          pending={subPending}
          formAction={subAction}
          hiddenFields={{ episode_id: episodeId, audio_url: ttsAudioUrl }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasSubtitleSrt && Boolean(subtitleArtifact?.content_text?.trim())}
          onView={() => setViewOpen("subtitle")}
          showCustomInstructions={false}
          renderAdvancedExtra={() => (
            <p className="text-[10px] text-text-tertiary leading-relaxed">
              {t("pipelineProduceSubtitleAdvancedHint")}
            </p>
          )}
        />

        <PreprodPipelineStep
          key={`produce-scene-${episodeId}`}
          step={6}
          label={t("draftSceneRenderCta")}
          done={hasSceneClips}
          disabled={!hasDraftScript || !runwayRenderReady}
          hint={!runwayRenderReady ? t("draftRunwayDisabledHint") : undefined}
          pending={scenePending}
          formAction={sceneAction}
          hiddenFields={{ episode_id: episodeId, script_text: scriptText }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasSceneClips && sceneClips.length > 0}
          onView={() => setViewOpen("scene")}
          showCustomInstructions={false}
          renderAdvancedExtra={(formId) => (
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceTargetSceneCountLabel")}
                </label>
                <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
                  {t("pipelineProduceTargetSceneCountHint")}
                </p>
                <select
                  name="target_scene_count"
                  form={formId}
                  defaultValue=""
                  className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                >
                  <option value="">{t("pipelineProduceTargetSceneCountAuto")}</option>
                  {[4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={String(n)}>
                      {t("pipelineProduceTargetSceneCountN", { n })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceScenesJsonLabel")}
                </label>
                <p className="text-[10px] text-text-tertiary mb-1.5 leading-relaxed">
                  {t("pipelineProduceScenesJsonHint")}
                </p>
                <textarea
                  name="scenes_json"
                  form={formId}
                  rows={4}
                  maxLength={50_000}
                  placeholder={SCENES_JSON_INPUT_PLACEHOLDER}
                  title={t("pipelineProduceScenesJsonPlaceholder")}
                  className="w-full rounded border border-border-subtle bg-field px-2 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary font-mono"
                />
              </div>
            </div>
          )}
        />

        <PreprodPipelineStep
          key={`produce-asm-${episodeId}`}
          step={7}
          label={t("draftAssembleCta")}
          done={hasAssembledVideo}
          disabled={!hasSceneClips}
          hint={!hasSceneClips ? t("draftAssembleDisabledHint") : undefined}
          pending={assemblyPending}
          formAction={assemblyAction}
          hiddenFields={{ episode_id: episodeId }}
          runLabel={t("pipelineStepRun")}
          redoLabel={t("pipelineStepRedo")}
          viewLabel={t("pipelineStepView")}
          showView={hasAssembledVideo && Boolean(assemblyArtifact?.external_url)}
          onView={() => setViewOpen("assembly")}
          showCustomInstructions={false}
          renderAdvancedExtra={(formId) => (
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceBgMusicLabel")}
                </label>
                <input
                  name="bg_music_url"
                  form={formId}
                  type="url"
                  maxLength={2000}
                  placeholder={t("pipelineProduceBgMusicPlaceholder")}
                  className="h-7 w-full rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                  {t("pipelineProduceBgMusicVolumeLabel")}
                </label>
                <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
                  {t("pipelineProduceBgMusicVolumeHint")}
                </p>
                <select
                  name="bg_music_volume"
                  form={formId}
                  defaultValue="0.15"
                  className="h-7 w-full max-w-xs rounded border border-border-subtle bg-field px-2 text-[11px] text-text-primary"
                >
                  {[0.05, 0.1, 0.15, 0.2, 0.25].map((v) => (
                    <option key={v} value={String(v)}>
                      {t("pipelineProduceBgMusicVolumeOption", { pct: Math.round(v * 100) })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        />

        <YoutubeUploadPipelineStep
          episodeId={episodeId}
          episodeTitle={episodeTitle}
          youtubeTitleDefault={packagingParsed?.youtube_title ?? ""}
          youtubeDescriptionDefault={packagingParsed?.youtube_description ?? ""}
          thumbnailUrl={thumbnailArtifact?.external_url?.trim() || null}
          hasAssembledVideo={hasAssembledVideo}
          hasYoutubePublish={hasYoutubePublish}
          publishUrl={publishUrl}
          youtubeChannelTitle={youtubeChannelTitle}
          episodeFormat={episodeFormat}
          distributionChannelLabel={distributionChannelLabel}
          step={8}
          ytState={ytState}
          formAction={ytAction}
          pending={ytPending}
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

function PreprodPipelineStep({
  step,
  label,
  done,
  disabled,
  hint,
  pending,
  formAction,
  hiddenFields,
  runLabel,
  redoLabel,
  viewLabel,
  showView,
  onView,
  modelOptions,
  defaultModel,
  modelFieldName = "model",
  showCustomInstructions = true,
  renderAdvancedExtra,
  draftInteractive,
}: {
  step: number;
  label: string;
  done: boolean;
  disabled: boolean;
  hint?: string;
  pending: boolean;
  formAction: (payload: FormData) => void;
  hiddenFields: Record<string, string>;
  runLabel: string;
  redoLabel: string;
  viewLabel: string;
  showView?: boolean;
  onView?: () => void;
  modelOptions?: Array<{ id: string; label: string }>;
  defaultModel?: string;
  /** Form field name for model select (e.g. `model_id` for ElevenLabs TTS). */
  modelFieldName?: string;
  showCustomInstructions?: boolean;
  renderAdvancedExtra?: (formId: string) => ReactNode;
  /** Draft shortcut card: Run/Redo/View open the dialog instead of posting a server action. */
  draftInteractive?: {
    canUse: boolean;
    showView: boolean;
    onPrimary: (p: { modelId: string; customInstructions: string }) => void;
    onView: () => void;
  };
}) {
  const tStep = useTranslations("Dashboard.productions");
  const formId = useId();
  const [advOpen, setAdvOpen] = useState(false);
  const isDraft = Boolean(draftInteractive);
  const hasAdvanced = Boolean(
    modelOptions?.length || showCustomInstructions || renderAdvancedExtra,
  );
  const [selectedModel, setSelectedModel] = useState(defaultModel ?? "");
  const [shortcutInstr, setShortcutInstr] = useState("");

  const stepBadge =
    done ? "\u2713" : step === 0 ? "0" : String(step);

  const showViewBtn = isDraft
    ? draftInteractive?.showView && draftInteractive.canUse
    : showView && onView;

  const onViewClick = isDraft ? draftInteractive?.onView : onView;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border px-3 py-3 shadow-sm transition-shadow",
        done
          ? "border-green-500/35 bg-green-500/[0.07] ring-1 ring-green-500/15"
          : disabled
            ? "border-border-subtle/50 bg-layer-02/20 opacity-60"
            : "border-border-subtle/90 bg-layer-02/45 ring-1 ring-black/[0.03] dark:ring-white/[0.04]",
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
            {stepBadge}
          </span>
          <span className="text-xs font-medium text-text-primary truncate">
            {label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {hasAdvanced && !disabled ? (
            <PipelineStepAdvancedToggle
              open={advOpen}
              onToggle={() => setAdvOpen((p) => !p)}
            />
          ) : null}
          {showViewBtn && onViewClick ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onViewClick}
              aria-label={viewLabel}
              title={viewLabel}
              className="gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span className="hidden sm:inline">{viewLabel}</span>
            </Button>
          ) : null}
          {isDraft && draftInteractive ? (
            <Button
              type="button"
              variant={done ? "secondary" : "ghost"}
              size="sm"
              disabled={disabled || !draftInteractive.canUse}
              onClick={() =>
                draftInteractive.onPrimary({
                  modelId: selectedModel,
                  customInstructions: shortcutInstr,
                })
              }
              aria-label={done ? redoLabel : runLabel}
              title={done ? redoLabel : runLabel}
              className="gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              {done ? (
                <RotateCw className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              )}
              <span className="hidden sm:inline">{done ? redoLabel : runLabel}</span>
            </Button>
          ) : (
            <form action={formAction} className="inline" id={formId}>
              {Object.entries(hiddenFields).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              {advOpen ? null : showCustomInstructions ? (
                <input type="hidden" name="custom_instructions" value="" />
              ) : null}
              <Button
                type="submit"
                variant={done ? "secondary" : "ghost"}
                size="sm"
                isLoading={pending}
                disabled={disabled}
                aria-label={done ? redoLabel : runLabel}
                title={done ? redoLabel : runLabel}
                className="gap-1 px-2.5 sm:gap-1.5 sm:px-3"
              >
                {!pending &&
                  (done ? (
                    <RotateCw className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  ) : (
                    <Play className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  ))}
                <span className="hidden sm:inline">{done ? redoLabel : runLabel}</span>
              </Button>
            </form>
          )}
        </div>
      </div>
      {hint && !done && (
        <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
          {hint}
        </p>
      )}
      {hasAdvanced && !disabled ? (
        <div
          className={cn(
            "mt-2 pl-7 space-y-2 border-t border-border-subtle/50 pt-2",
            !advOpen && "hidden",
          )}
        >
          {modelOptions?.length ? (
            <div>
              <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
                {tStep("pipelineStepModelLabel")}
              </label>
              <select
                name={isDraft ? undefined : modelFieldName}
                form={isDraft ? undefined : formId}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="h-8 w-full max-w-xs rounded-md border border-border-subtle bg-field px-2 text-[11px] text-text-primary shadow-inner"
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
                {tStep("pipelineStepCustomInstructionsLabel")}
              </label>
              {isDraft ? (
                <input
                  value={shortcutInstr}
                  onChange={(e) => setShortcutInstr(e.target.value)}
                  maxLength={500}
                  placeholder={tStep("pipelineStepCustomInstructionsPlaceholder")}
                  className="h-8 w-full rounded-md border border-border-subtle bg-field px-2 text-[11px] text-text-primary shadow-inner placeholder:text-text-tertiary"
                />
              ) : (
                <input
                  name="custom_instructions"
                  form={formId}
                  maxLength={500}
                  placeholder={tStep("pipelineStepCustomInstructionsPlaceholder")}
                  className="h-8 w-full rounded-md border border-border-subtle bg-field px-2 text-[11px] text-text-primary shadow-inner placeholder:text-text-tertiary"
                />
              )}
            </div>
          ) : null}
          {renderAdvancedExtra ? renderAdvancedExtra(formId) : null}
        </div>
      ) : null}
    </div>
  );
}
