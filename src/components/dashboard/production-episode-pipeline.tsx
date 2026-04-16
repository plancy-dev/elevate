"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateTtsFromScript, generateSubtitlesFromAudio } from "@/actions/studio-tts";
import { renderEpisodeScenes } from "@/actions/studio-scene-render";
import { assembleEpisodeVideo } from "@/actions/studio-video-assembly";
import { uploadEpisodeToYouTube } from "@/actions/studio-youtube";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

type PipelineProps = {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  runwayRenderReady?: boolean;
  className?: string;
};

type PipelineStepActionState = {
  ok?: boolean;
  error?: string;
} | null;

function usePipelineStepToast(
  state: PipelineStepActionState,
  successKey: string,
  t: ReturnType<typeof useTranslations>,
  router: ReturnType<typeof useRouter>,
) {
  const handledStateRef = useRef<PipelineStepActionState>(null);

  useEffect(() => {
    if (!state || handledStateRef.current === state) return;
    handledStateRef.current = state;

    if (state.ok) {
      toast.success(t(successKey));
      router.refresh();
      return;
    }

    if (state.error) {
      toast.error(translateActionErrorMessage(state.error, t));
    }
  }, [router, state, successKey, t]);
}

export function ProductionEpisodePipeline({
  episodeId,
  artifacts,
  runwayRenderReady = false,
  className,
}: PipelineProps) {
  const t = useTranslations("Dashboard.productions");
  const router = useRouter();

  const hasDraftScript = artifacts.some(
    (a) => a.artifact_role === "script_draft" || a.artifact_role === "script",
  );
  const hasTtsAudio = artifacts.some((a) => a.artifact_role === "tts_audio");
  const hasSubtitleSrt = artifacts.some((a) => a.artifact_role === "subtitle_srt");
  const hasSceneClips = artifacts.some((a) => a.artifact_role === "scene_clip");
  const hasAssembledVideo = artifacts.some((a) => a.artifact_role === "assembled_video");

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

  usePipelineStepToast(ttsState, "draftTtsSuccess", t, router);
  usePipelineStepToast(subState, "draftSubtitleSuccess", t, router);
  usePipelineStepToast(sceneState, "draftSceneRenderSuccess", t, router);
  usePipelineStepToast(assemblyState, "draftAssembleSuccess", t, router);
  usePipelineStepToast(ytState, "draftYoutubeSuccess", t, router);

  return (
    <div className={cn("flex flex-col gap-4 border-t border-border-subtle pt-5", className)}>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          {t("draftPipelineTitle")}
        </h3>
        <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
          {t("draftPipelineSubtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Step 1: TTS */}
        <PipelineStep
          step={1}
          label={t("draftTtsCta")}
          done={hasTtsAudio}
          disabled={!hasDraftScript}
          hint={!hasDraftScript ? t("draftTtsDisabledHint") : undefined}
          pending={ttsPending}
          formAction={ttsAction}
          hiddenFields={{ episode_id: episodeId, script_text: scriptText }}
        />

        {/* Step 2: Subtitles */}
        <PipelineStep
          step={2}
          label={t("draftSubtitleCta")}
          done={hasSubtitleSrt}
          disabled={!hasTtsAudio}
          hint={!hasTtsAudio ? t("draftSubtitleDisabledHint") : undefined}
          pending={subPending}
          formAction={subAction}
          hiddenFields={{ episode_id: episodeId, audio_url: ttsAudioUrl }}
        />

        {/* Step 3: Scene Render */}
        <PipelineStep
          step={3}
          label={t("draftSceneRenderCta")}
          done={hasSceneClips}
          disabled={!hasDraftScript || !runwayRenderReady}
          hint={!runwayRenderReady ? t("draftRunwayDisabledHint") : undefined}
          pending={scenePending}
          formAction={sceneAction}
          hiddenFields={{ episode_id: episodeId, script_text: scriptText }}
        />

        {/* Step 4: Assemble */}
        <PipelineStep
          step={4}
          label={t("draftAssembleCta")}
          done={hasAssembledVideo}
          disabled={!hasSceneClips}
          hint={!hasSceneClips ? t("draftAssembleDisabledHint") : undefined}
          pending={assemblyPending}
          formAction={assemblyAction}
          hiddenFields={{ episode_id: episodeId }}
        />

        {/* Step 5: YouTube Upload */}
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
        />
      </div>

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
            {done ? "Redo" : "Run"}
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
