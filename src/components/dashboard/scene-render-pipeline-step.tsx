"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChevronDown, Eye, ListTree, Play, RotateCw, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { saveEpisodePipelinePrefs } from "@/actions/studio-episode-pipeline-prefs";
import {
  prepareSceneRenderPlan,
  renderSceneAtIndex,
  generateScenePlanWithLlm,
} from "@/actions/studio-scene-render";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { PipelineStepAdvancedToggle } from "@/components/dashboard/pipeline-step-advanced-toggle";
import { SCENES_JSON_INPUT_PLACEHOLDER } from "@/lib/studio-productions/scenes-json-placeholder";
import { DEFAULT_PACKAGING_DRAFT_MODEL_ID } from "@/lib/studio-productions/episode-llm-models";
import {
  RUNWAY_TEXT_TO_VIDEO_MODEL_IDS,
  parseRunwaySceneModelId,
  type RunwayTextToVideoModelId,
} from "@/lib/studio-integrations/providers/runway/runway-scene-models";
import {
  estimateSceneRenderCredits,
  estimateSceneRenderCreditsForDuration,
} from "@/lib/studio-integrations/providers/runway/runway-scene-credits-estimate";
import {
  SCENE_BUDGET_MAX_TOTAL_SECONDS,
  SCENE_BUDGET_WARN_TOTAL_SECONDS,
} from "@/lib/studio-productions/scene-budget-constants";
import { parseSceneRows, type SceneRow } from "@/lib/studio-productions/scene-rows-json";
import { SceneClipUploadRows } from "@/components/dashboard/scene-clip-upload-rows";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

const SCENE_CONCURRENCY = 3;

const RUNWAY_MODEL_LABEL_KEYS: Record<RunwayTextToVideoModelId, string> = {
  "gen4.5": "pipelineSceneRunwayModelGen45",
  "veo3.1": "pipelineSceneRunwayModelVeo31",
  "veo3.1_fast": "pipelineSceneRunwayModelVeo31Fast",
  veo3: "pipelineSceneRunwayModelVeo3",
};

type PerIndex = Record<number, "queued" | "running" | "ok" | "error">;

type SceneRenderPreflight = {
  payload: string;
  indices: number[];
  sceneCount: number;
  estimatedCredits: number;
  totalDurationSeconds?: number;
  budgetWarning?: "overSoftBudget";
};

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const queue = items.map((item, i) => ({ item, i }));
  const results: R[] = new Array(items.length);
  const workerCount = Math.min(Math.max(1, limit), items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      for (;;) {
        const next = queue.shift();
        if (!next) break;
        results[next.i] = await fn(next.item);
      }
    }),
  );
  return results;
}

function ScenePlanDialogTable({
  rows,
  runwayModel,
  rowStatus,
  hasSceneActivity,
  estimatedCredits,
}: {
  rows: SceneRow[];
  runwayModel: RunwayTextToVideoModelId;
  rowStatus: PerIndex;
  hasSceneActivity: boolean;
  estimatedCredits: number;
}) {
  const t = useTranslations("Dashboard.productions");

  return (
    <div className="max-w-full min-w-0 overflow-x-auto border border-ink-100 bg-paper-50">
      <table className="w-full min-w-3xl border-collapse text-left text-[11px] text-ink-700 sm:min-w-4xl">
        <thead>
          <tr className="border-b border-ink-100 bg-paper-100 font-mono text-[10px] text-ink-500">
            <th
              scope="col"
              className="w-14 min-w-14 whitespace-nowrap py-2 pl-2 pr-2 text-left font-medium sm:w-16"
            >
              {t("pipelineSceneColScene")}
            </th>
            <th
              scope="col"
              className="w-11 min-w-11 whitespace-nowrap py-2 pr-2 text-left font-medium tabular-nums"
            >
              {t("pipelineSceneColDurationSec")}
            </th>
            <th
              scope="col"
              className="min-w-22 whitespace-nowrap py-2 pr-2 text-left font-medium tabular-nums"
            >
              {t("pipelineSceneColEstCredits")}
            </th>
            <th scope="col" className="min-w-48 py-2 pr-2 text-left font-medium lg:min-w-56">
              {t("pipelineSceneColNarration")}
            </th>
            <th scope="col" className="min-w-48 py-2 pr-2 text-left font-medium lg:min-w-64">
              {t("pipelineSceneColVisualPrompt")}
            </th>
            {hasSceneActivity ? (
              <th
                scope="col"
                className="w-16 min-w-16 whitespace-nowrap py-2 pl-1 pr-2 text-right font-medium"
              >
                {t("pipelineSceneColStatus")}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const perScene = estimateSceneRenderCreditsForDuration(
              runwayModel,
              row.durationSeconds,
            );
            const st = rowStatus[row.index];
            const statusLabel =
              st === "running"
                ? t("pipelineSceneStatusRunning")
                : st === "ok"
                  ? t("pipelineSceneStatusDone")
                  : st === "error"
                    ? t("pipelineSceneStatusError")
                    : st === "queued"
                      ? t("pipelineSceneStatusQueued")
                      : null;
            const narrationPreview = row.narration.trim();
            return (
              <tr key={row.index} className="border-b border-ink-100/80">
                <td className="whitespace-nowrap py-2 pl-2 pr-2 align-top tabular-nums">
                  {t("pipelineSceneRowLabel", { index: row.index + 1 })}
                </td>
                <td className="whitespace-nowrap py-2 pr-2 align-top tabular-nums">
                  {row.durationSeconds}
                </td>
                <td className="whitespace-nowrap py-2 pr-2 align-top tabular-nums">~{perScene}</td>
                <td className="max-w-[min(28rem,40vw)] align-top text-[11px] leading-snug">
                  <span className="wrap-break-word text-ink-700">{narrationPreview}</span>
                </td>
                <td className="max-w-[min(28rem,40vw)] align-top text-[11px] leading-snug">
                  <span className="wrap-break-word text-ink-700">{row.visualPrompt}</span>
                </td>
                {hasSceneActivity ? (
                  <td className="whitespace-nowrap py-2 pl-1 pr-2 align-top text-right">
                    {statusLabel ? (
                      <span
                        className={cn(
                          "inline-block border px-1.5 py-0.5 font-mono text-[10px]",
                          st === "ok"
                            ? "border-vermilion-600/40 bg-paper-0 text-vermilion-600"
                            : st === "error"
                              ? "border-vermilion-600 bg-paper-0 text-vermilion-600"
                              : st === "running"
                                ? "border-ink-300 bg-paper-0 text-ink-900"
                                : "border-ink-100 bg-paper-100 text-ink-500",
                        )}
                      >
                        {statusLabel}
                      </span>
                    ) : (
                      <span className="text-ink-500">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-ink-100">
            <td
              colSpan={hasSceneActivity ? 6 : 5}
              className="py-2 pl-2 pr-2 font-mono text-[10px] text-ink-500"
            >
              {t("pipelineScenePlanTableTotal", { credits: estimatedCredits })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function SceneRenderPipelineStep({
  step,
  episodeId,
  scriptText,
  hasDraftScript,
  runwayRenderReady,
  packagingLlmReady,
  packagingModelOptions,
  defaultScenePlanModel = DEFAULT_PACKAGING_DRAFT_MODEL_ID,
  hasSceneClips,
  showView,
  onView,
  persistPlanModelId = "",
  persistScenesJson = "",
  persistTargetSceneCount = "",
  persistRunwayModelId = "",
  persistVisualPromptSuffix = "",
  canPersistPipelinePrefs = false,
}: {
  step: number;
  episodeId: string;
  scriptText: string;
  hasDraftScript: boolean;
  runwayRenderReady?: boolean;
  packagingLlmReady?: boolean;
  packagingModelOptions: Array<{ id: string; label: string }>;
  defaultScenePlanModel?: string;
  hasSceneClips: boolean;
  showView: boolean;
  onView: () => void;
  /** Loaded from `studio_production_episodes.pipeline_prefs.sceneRender` */
  persistPlanModelId?: string;
  persistScenesJson?: string;
  persistTargetSceneCount?: string;
  persistRunwayModelId?: string;
  persistVisualPromptSuffix?: string;
  canPersistPipelinePrefs?: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const advId = useId();
  const [advOpen, setAdvOpen] = useState(false);
  const [scenePlanDialogOpen, setScenePlanDialogOpen] = useState(false);
  const [selectedPlanModel, setSelectedPlanModel] = useState(
    () => persistPlanModelId.trim() || defaultScenePlanModel,
  );
  const [scenesJsonControlled, setScenesJsonControlled] = useState(() => persistScenesJson);
  const [targetSceneCount, setTargetSceneCount] = useState(() => persistTargetSceneCount);
  const [runwayModel, setRunwayModel] = useState<RunwayTextToVideoModelId>(() =>
    parseRunwaySceneModelId(persistRunwayModelId),
  );
  const [visualPromptSuffix, setVisualPromptSuffix] = useState(
    () => persistVisualPromptSuffix,
  );
  const [rowStatus, setRowStatus] = useState<PerIndex>({});
  const skipScenePersistRef = useRef(true);
  const [orchestrating, startOrchestrate] = useTransition();
  const [llmPending, startLlm] = useTransition();
  const [prefsSavePending, startPrefsSave] = useTransition();
  const preflightRef = useRef<HTMLDialogElement>(null);
  const [preflightData, setPreflightData] = useState<SceneRenderPreflight | null>(null);
  const preflightTitleId = useId();

  const disabled = !hasDraftScript || !runwayRenderReady;
  const done = hasSceneClips;

  const sceneRowsFromStatus = useMemo(() => {
    const keys = Object.keys(rowStatus).map((k) => Number.parseInt(k, 10)).filter(Number.isFinite);
    if (keys.length === 0) return [];
    return keys.sort((a, b) => a - b);
  }, [rowStatus]);

  const showProgress = sceneRowsFromStatus.length > 0;

  const hasFailures = useMemo(
    () => Object.values(rowStatus).some((s) => s === "error"),
    [rowStatus],
  );

  const parsedSceneRowsForEstimate = useMemo(
    () => parseSceneRows(scenesJsonControlled),
    [scenesJsonControlled],
  );

  const estimatedRunwayCredits = useMemo(() => {
    if (!parsedSceneRowsForEstimate?.length) return null;
    return estimateSceneRenderCredits(runwayModel, parsedSceneRowsForEstimate);
  }, [parsedSceneRowsForEstimate, runwayModel]);

  const showPlanTable =
    !disabled &&
    parsedSceneRowsForEstimate != null &&
    parsedSceneRowsForEstimate.length > 0;

  const hasSceneActivity = Object.keys(rowStatus).length > 0;

  const selectedPlanModelLabel = useMemo(
    () =>
      packagingModelOptions.find((o) => o.id === selectedPlanModel)?.label ??
      selectedPlanModel,
    [packagingModelOptions, selectedPlanModel],
  );

  /* Hydrate when switching episodes only — avoids resetting local JSON after prefs save (no RSC revalidate on prefs). */
  useEffect(() => {
    skipScenePersistRef.current = true;
    setSelectedPlanModel(persistPlanModelId.trim() || defaultScenePlanModel);
    setScenesJsonControlled(persistScenesJson);
    setTargetSceneCount(persistTargetSceneCount);
    setRunwayModel(parseRunwaySceneModelId(persistRunwayModelId));
    setVisualPromptSuffix(persistVisualPromptSuffix);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist* intentionally omitted (see comment above)
  }, [episodeId]);

  useEffect(() => {
    if (!canPersistPipelinePrefs) return;
    if (skipScenePersistRef.current) {
      skipScenePersistRef.current = false;
      return;
    }
    const debounceTimer = window.setTimeout(() => {
      void (async () => {
        const res = await saveEpisodePipelinePrefs(episodeId, {
          sceneRender: {
            scenesJson: scenesJsonControlled,
            planModelId: selectedPlanModel,
            targetSceneCount,
            runwayModelId: runwayModel,
            visualPromptSuffix,
          },
        });
        if ("error" in res && res.error) {
          toast.error(translateActionErrorMessage(res.error, tAction));
        }
      })();
    }, 650);
    return () => clearTimeout(debounceTimer);
  }, [
    canPersistPipelinePrefs,
    episodeId,
    scenesJsonControlled,
    selectedPlanModel,
    targetSceneCount,
    runwayModel,
    visualPromptSuffix,
    tAction,
  ]);

  const onSaveScenePrefsNow = useCallback(() => {
    if (!canPersistPipelinePrefs) return;
    startPrefsSave(async () => {
      const res = await saveEpisodePipelinePrefs(episodeId, {
        sceneRender: {
          scenesJson: scenesJsonControlled,
          planModelId: selectedPlanModel,
          targetSceneCount,
          runwayModelId: runwayModel,
          visualPromptSuffix,
        },
      });
      if ("error" in res && res.error) {
        toast.error(translateActionErrorMessage(res.error, tAction));
        return;
      }
      toast.success(t("pipelinePrefsSavedToast"));
    });
  }, [
    canPersistPipelinePrefs,
    episodeId,
    scenesJsonControlled,
    selectedPlanModel,
    targetSceneCount,
    runwayModel,
    visualPromptSuffix,
    tAction,
    t,
  ]);

  const readAdvancedForm = useCallback(() => {
    const fd = new FormData();
    fd.set("episode_id", episodeId);
    fd.set("script_text", scriptText);
    fd.set("target_scene_count", targetSceneCount);
    const jsonVal = scenesJsonControlled;
    fd.set("scenes_json", jsonVal);
    return fd;
  }, [episodeId, scriptText, scenesJsonControlled, targetSceneCount]);

  const renderIndices = useCallback(
    async (indices: number[], scenesPayload: string, kind: "full" | "retry") => {
      const init: PerIndex = {};
      for (const idx of indices) init[idx] = "queued";
      setRowStatus(init);

      const results = await mapPool(indices, SCENE_CONCURRENCY, async (sceneIndex) => {
        setRowStatus((prev) => ({ ...prev, [sceneIndex]: "running" }));
        const fd = new FormData();
        fd.set("episode_id", episodeId);
        fd.set("scenes_payload", scenesPayload);
        fd.set("scene_index", String(sceneIndex));
        fd.set("replace_existing", "1");
        fd.set("runway_model", runwayModel);
        fd.set("visual_prompt_suffix", visualPromptSuffix);
        const res = await renderSceneAtIndex(null, fd);
        const ok = Boolean(res.ok);
        setRowStatus((prev) => ({ ...prev, [sceneIndex]: ok ? "ok" : "error" }));
        if (!ok) {
          const msg = translateActionErrorMessage(res.error, tAction);
          toast.error(t("pipelineSceneSceneFailedToast", { index: sceneIndex + 1 }), {
            description: msg,
          });
        }
        return ok;
      });

      router.refresh();

      const allOk = results.length > 0 && results.every(Boolean);
      if (allOk) {
        toast.success(
          kind === "retry" ? t("pipelineSceneRetrySuccessToast") : t("draftSceneRenderSuccess"),
        );
      }
    },
    [episodeId, router, runwayModel, visualPromptSuffix, t, tAction],
  );

  const onPrimary = useCallback(() => {
    startOrchestrate(async () => {
      const prep = await prepareSceneRenderPlan(null, readAdvancedForm());
      if (prep.error) {
        toast.error(translateActionErrorMessage(prep.error, tAction));
        return;
      }
      const payload = prep.scenesPayload;
      if (!payload) {
        toast.error(translateActionErrorMessage("unexpected", tAction));
        return;
      }
      const rows = parseSceneRows(payload);
      if (!rows?.length) {
        toast.error(translateActionErrorMessage("studioSceneRenderInvalidJson", tAction));
        return;
      }
      const estimatedCredits = estimateSceneRenderCredits(runwayModel, rows);
      setPreflightData({
        payload,
        indices: rows.map((r) => r.index),
        sceneCount: rows.length,
        estimatedCredits,
        totalDurationSeconds: prep.totalDurationSeconds,
        budgetWarning: prep.budgetWarning,
      });
      queueMicrotask(() => preflightRef.current?.showModal());
    });
  }, [readAdvancedForm, runwayModel, tAction]);

  const onPreflightConfirm = useCallback(() => {
    const d = preflightData;
    if (!d) return;
    preflightRef.current?.close();
    startOrchestrate(async () => {
      await renderIndices(d.indices, d.payload, "full");
    });
  }, [preflightData, renderIndices, startOrchestrate]);

  const onRetryFailed = useCallback(() => {
    startOrchestrate(async () => {
      const prep = await prepareSceneRenderPlan(null, readAdvancedForm());
      if (prep.error) {
        toast.error(translateActionErrorMessage(prep.error, tAction));
        return;
      }
      const payload = prep.scenesPayload;
      if (!payload) return;
      const rows = parseSceneRows(payload);
      if (!rows?.length) return;
      const failed = rows.map((r) => r.index).filter((i) => rowStatus[i] === "error");
      if (failed.length === 0) return;
      await renderIndices(failed, payload, "retry");
    });
  }, [readAdvancedForm, renderIndices, rowStatus, tAction]);

  const onGeneratePlan = useCallback(() => {
    if (!packagingLlmReady || !scriptText.trim()) {
      toast.error(t("pipelineScenePlanLlmNeedScript"));
      return;
    }
    startLlm(async () => {
      const fd = new FormData();
      fd.set("episode_id", episodeId);
      fd.set("script_text", scriptText);
      fd.set("model", selectedPlanModel);
      const res = await generateScenePlanWithLlm(null, fd);
      if (res.error) {
        toast.error(translateActionErrorMessage(res.error, tAction));
        return;
      }
      if (res.scenesJson) {
        setScenesJsonControlled(res.scenesJson);
        setAdvOpen(true);
        toast.success(t("pipelineScenePlanLlmSuccess"));
      }
    });
  }, [episodeId, packagingLlmReady, scriptText, selectedPlanModel, t, tAction]);

  /** When the plan table shows per-row status, skip the legacy bullet list to avoid duplication. */
  const showLegacyProgressList = showProgress && (!showPlanTable || !hasSceneActivity);

  const stepBadge = done ? "\u2713" : step === 0 ? "0" : String(step);

  return (
    <>
    <div
      id="scene-render-pipeline"
      className={cn(
        "flex flex-col border px-3 py-3 sm:px-3.5 scroll-mt-24",
        done
          ? "border-vermilion-600/35 bg-paper-0"
          : disabled
            ? "border-ink-100 bg-paper-100 opacity-60"
            : "border-ink-100 bg-paper-100",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[10px]",
              done
                ? "border-vermilion-600 text-vermilion-600"
                : "border-ink-300 text-ink-500",
            )}
            aria-hidden
          >
            {stepBadge}
          </span>
          <span className="truncate text-xs font-medium text-ink-900">
            {t("draftSceneRenderCta")}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {!disabled ? (
            <PipelineStepAdvancedToggle open={advOpen} onToggle={() => setAdvOpen((p) => !p)} />
          ) : null}
          {showPlanTable ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 gap-1 px-2.5 sm:gap-1.5 sm:px-3"
              onClick={() => setScenePlanDialogOpen(true)}
              aria-label={t("pipelineScenePlanOpenAria")}
              title={t("pipelineScenePlanOpenAria")}
            >
              <ListTree className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span>{t("pipelineScenePlanOpenDialog")}</span>
            </Button>
          ) : null}
          {showView && onView ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onView}
              aria-label={t("pipelineSceneClipsViewAria")}
              title={t("pipelineSceneClipsViewAria")}
              className="h-7 gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span>{t("pipelineStepView")}</span>
            </Button>
          ) : null}
          {hasFailures && !orchestrating ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRetryFailed}
              className="h-7 gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              {t("pipelineSceneRetryFailed")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={done ? "secondary" : "primary"}
            size="sm"
            disabled={disabled || orchestrating}
            isLoading={orchestrating}
            onClick={onPrimary}
            aria-label={done ? t("pipelineStepRedo") : t("pipelineStepRun")}
            title={done ? t("pipelineStepRedo") : t("pipelineStepRun")}
            className="h-7 gap-1 px-2.5 sm:gap-1.5 sm:px-3"
          >
            {!orchestrating &&
              (done ? (
                <RotateCw className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              ))}
            <span>{done ? t("pipelineStepRedo") : t("pipelineStepRun")}</span>
          </Button>
        </div>
      </div>

      {!runwayRenderReady && !done ? (
        <p className="mt-1.5 border border-vermilion-600/30 bg-vermilion-100/40 px-2 py-1.5 text-[11px] leading-snug text-vermilion-600">
          {t("draftRunwayDisabledHint")}
        </p>
      ) : null}

      {!disabled ? (
        <form
          id={advId}
          className={cn(
            "mt-2 space-y-3 border-t border-ink-100 pt-3 pl-7",
            !advOpen && "hidden",
          )}
        >
          <div>
            <label
              className="mb-0.5 block font-mono text-[10px] text-ink-500"
              htmlFor={`${advId}-runway-model`}
            >
              {t("pipelineSceneRunwayVideoModelLabel")}
            </label>
            <p className="mb-1 text-[10px] leading-relaxed text-ink-500">
              {t("pipelineSceneRunwayVideoModelHint")}
            </p>
            <div className="relative min-w-0 max-w-md">
              <select
                id={`${advId}-runway-model`}
                value={runwayModel}
                onChange={(e) =>
                  setRunwayModel(parseRunwaySceneModelId(e.target.value))
                }
                aria-label={t("pipelineSceneRunwayVideoModelLabel")}
                className={cn(
                  "h-7 w-full min-w-0 max-w-full cursor-pointer appearance-none border-b border-ink-300 bg-transparent",
                  "pl-0 pr-8 text-left text-[11px] text-ink-900",
                  "overflow-hidden text-ellipsis whitespace-nowrap",
                  "focus-visible:border-vermilion-600 focus-visible:outline-none",
                )}
              >
                {RUNWAY_TEXT_TO_VIDEO_MODEL_IDS.map((id) => (
                  <option key={id} value={id}>
                    {t(RUNWAY_MODEL_LABEL_KEYS[id])}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-0 z-1 h-3.5 w-3.5 -translate-y-1/2 text-ink-500 opacity-90"
                aria-hidden
              />
            </div>
          </div>
          <div>
            <label
              className="mb-0.5 block font-mono text-[10px] text-ink-500"
              htmlFor={`${advId}-runway-suffix`}
            >
              {t("pipelineSceneRunwayVisualSuffixLabel")}
            </label>
            <p className="mb-1 text-[10px] leading-relaxed text-ink-500">
              {t("pipelineSceneRunwayVisualSuffixHint")}
            </p>
            <textarea
              id={`${advId}-runway-suffix`}
              rows={2}
              maxLength={2000}
              value={visualPromptSuffix}
              onChange={(e) => setVisualPromptSuffix(e.target.value)}
              className="w-full border border-ink-100 bg-paper-0 px-2 py-1.5 text-[11px] text-ink-900 placeholder:text-ink-400"
              placeholder={t("pipelineSceneRunwayVisualSuffixPlaceholder")}
            />
          </div>
          {packagingLlmReady ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  className="mb-0.5 block font-mono text-[10px] text-ink-500"
                  htmlFor={`${advId}-plan-model`}
                >
                  {t("pipelineScenePlanLlmModelLabel")}
                </label>
                <div className="relative min-w-0">
                  <select
                    id={`${advId}-plan-model`}
                    value={selectedPlanModel}
                    onChange={(e) => setSelectedPlanModel(e.target.value)}
                    title={selectedPlanModelLabel}
                    aria-label={t("pipelineScenePlanLlmModelLabel")}
                    className={cn(
                      "h-7 w-full min-w-0 max-w-full cursor-pointer appearance-none border-b border-ink-300 bg-transparent",
                      "pl-0 pr-8 text-left text-[11px] text-ink-900",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      "focus-visible:border-vermilion-600 focus-visible:outline-none",
                    )}
                  >
                    {packagingModelOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-0 z-1 h-3.5 w-3.5 -translate-y-1/2 text-ink-500 opacity-90"
                    aria-hidden
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={llmPending || !scriptText.trim()}
                isLoading={llmPending}
                onClick={onGeneratePlan}
                className="gap-1 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t("pipelineScenePlanLlmCta")}
              </Button>
            </div>
          ) : null}
          {packagingLlmReady ? (
            <p className="text-[10px] leading-relaxed text-ink-500">{t("pipelineScenePlanLlmHint")}</p>
          ) : null}

          <div>
            <label className="mb-0.5 block font-mono text-[10px] text-ink-500">
              {t("pipelineProduceTargetSceneCountLabel")}
            </label>
            <p className="mb-1 text-[10px] leading-relaxed text-ink-500">
              {t("pipelineProduceTargetSceneCountHint")}
            </p>
            <select
              name="target_scene_count"
              value={targetSceneCount}
              onChange={(e) => setTargetSceneCount(e.target.value)}
              className="h-7 w-full max-w-xs border-b border-ink-300 bg-transparent px-0 text-[11px] text-ink-900 outline-none focus:border-vermilion-600"
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
            <label className="mb-0.5 block font-mono text-[10px] text-ink-500">
              {t("pipelineProduceScenesJsonLabel")}
            </label>
            <p className="mb-1.5 text-[10px] leading-relaxed text-ink-500">
              {t("pipelineProduceScenesJsonHint")}
            </p>
            <textarea
              name="scenes_json"
              rows={4}
              maxLength={50_000}
              value={scenesJsonControlled}
              onChange={(e) => setScenesJsonControlled(e.target.value)}
              placeholder={SCENES_JSON_INPUT_PLACEHOLDER}
              title={t("pipelineProduceScenesJsonPlaceholder")}
              className="w-full border border-ink-100 bg-paper-0 px-2 py-1.5 font-mono text-[11px] text-ink-900 placeholder:text-ink-400"
            />
            <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] leading-relaxed text-ink-500">
                {t("pipelinePrefsAutoSaveHint")}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-start sm:self-auto"
                disabled={!canPersistPipelinePrefs || prefsSavePending}
                isLoading={prefsSavePending}
                onClick={onSaveScenePrefsNow}
              >
                {t("pipelinePrefsSaveNow")}
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {showLegacyProgressList ? (
        <ul className="mt-2 space-y-1.5 border-t border-ink-100 pt-2 pl-7">
          <li className="mb-1.5 text-[10px] leading-relaxed text-ink-500">
            {t("pipelineSceneRunwayQueueRefreshHint")}
          </li>
          <li className="mb-1 font-mono text-[10px] text-ink-500">
            {t("pipelineSceneSceneListHeading")}
          </li>
          {sceneRowsFromStatus.map((idx) => {
            const st = rowStatus[idx] ?? "queued";
            const label =
              st === "running"
                ? t("pipelineSceneStatusRunning")
                : st === "ok"
                  ? t("pipelineSceneStatusDone")
                  : st === "error"
                    ? t("pipelineSceneStatusError")
                    : t("pipelineSceneStatusQueued");
            return (
              <li
                key={idx}
                className="flex items-center justify-between gap-2 text-[11px] text-ink-700"
              >
                <span className="min-w-0 truncate">
                  {t("pipelineSceneRowLabel", { index: idx + 1 })}
                </span>
                <span
                  className={cn(
                    "shrink-0 border px-1.5 py-0.5 font-mono text-[10px]",
                    st === "ok"
                      ? "border-vermilion-600/40 bg-paper-0 text-vermilion-600"
                      : st === "error"
                        ? "border-vermilion-600 bg-paper-0 text-vermilion-600"
                        : st === "running"
                          ? "border-ink-300 bg-paper-0 text-ink-900"
                          : "border-ink-100 bg-paper-100 text-ink-500",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <dialog
        ref={preflightRef}
        className="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,32rem)] w-[min(100vw-2rem,22rem)] -translate-x-1/2 -translate-y-1/2 border border-ink-100 bg-paper-100 p-0 text-ink-900 backdrop:bg-black/50"
        aria-labelledby={preflightTitleId}
        onClose={() => setPreflightData(null)}
      >
        {preflightData ? (
          <div className="flex max-h-[min(90vh,32rem)] flex-col">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <h2 id={preflightTitleId} className="text-sm font-semibold text-ink-900">
                {t("pipelineScenePreflightTitle")}
              </h2>
              <button
                type="button"
                onClick={() => preflightRef.current?.close()}
                className="p-1.5 text-ink-500 hover:bg-paper-0 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vermilion-600"
                aria-label={t("pipelineScenePreflightCloseLabel")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto px-4 pb-3 pt-3 text-xs">
              <p className="leading-snug text-ink-700">
                {t("pipelineScenePreflightSummary", {
                  count: preflightData.sceneCount,
                  credits: preflightData.estimatedCredits,
                })}
              </p>
              {preflightData.totalDurationSeconds != null ? (
                <p className="text-ink-500">
                  {t("pipelineScenePreflightDuration", {
                    seconds: preflightData.totalDurationSeconds,
                  })}
                </p>
              ) : null}
              <p className="text-[10px] leading-relaxed text-ink-500">
                {t("pipelineSceneBudgetThresholds", {
                  warnSeconds: SCENE_BUDGET_WARN_TOTAL_SECONDS,
                  maxSeconds: SCENE_BUDGET_MAX_TOTAL_SECONDS,
                })}
              </p>
              {preflightData.budgetWarning === "overSoftBudget" &&
              preflightData.totalDurationSeconds != null ? (
                <p className="border border-vermilion-600/30 bg-vermilion-100/40 px-2 py-1.5 text-[11px] text-vermilion-600">
                  {t("pipelineSceneBudgetSoftWarning", {
                    seconds: preflightData.totalDurationSeconds,
                  })}
                </p>
              ) : null}
              <p className="text-[10px] leading-relaxed text-ink-500">
                {t("pipelineSceneEstimatedCreditsDisclaimer")}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-4 py-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => preflightRef.current?.close()}
              >
                {t("pipelineScenePreflightCancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={orchestrating}
                isLoading={orchestrating}
                onClick={onPreflightConfirm}
              >
                {t("pipelineScenePreflightProceed")}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>

    <Modal
      open={scenePlanDialogOpen}
      onClose={() => setScenePlanDialogOpen(false)}
      title={t("pipelineScenePlanTableCaption")}
      description={t("pipelineScenePlanDialogDescription")}
      size="2xl"
      className="max-w-[min(96vw,56rem)]"
      stackClassName="z-[85]"
    >
      <div className="space-y-0">
        {parsedSceneRowsForEstimate != null &&
        parsedSceneRowsForEstimate.length > 0 &&
        estimatedRunwayCredits != null ? (
          <ScenePlanDialogTable
            rows={parsedSceneRowsForEstimate}
            runwayModel={runwayModel}
            rowStatus={rowStatus}
            hasSceneActivity={hasSceneActivity}
            estimatedCredits={estimatedRunwayCredits}
          />
        ) : null}
        {parsedSceneRowsForEstimate != null &&
        parsedSceneRowsForEstimate.length > 0 &&
        !disabled ? (
          <div
            className={cn(
              estimatedRunwayCredits != null && "mt-4 border-t border-ink-100 pt-4",
            )}
          >
            <SceneClipUploadRows episodeId={episodeId} rows={parsedSceneRowsForEstimate} />
          </div>
        ) : null}
      </div>
    </Modal>
    </>
  );
}
