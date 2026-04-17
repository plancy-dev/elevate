"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { ChevronDown, Eye, Play, RotateCw, Sparkles } from "lucide-react";
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
import { parseSceneRows } from "@/lib/studio-productions/scene-rows-json";
import { Button } from "@/components/ui/button";
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
  brandGuide,
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
  brandGuide?: string | null;
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
      if (prep.budgetWarning === "overSoftBudget" && prep.totalDurationSeconds != null) {
        toast(t("pipelineSceneBudgetSoftWarning", { seconds: prep.totalDurationSeconds }), {
          duration: 8000,
        });
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
      await renderIndices(rows.map((r) => r.index), payload, "full");
    });
  }, [readAdvancedForm, renderIndices, tAction, t]);

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
    <div
      className={cn(
        "flex flex-col rounded-xl border px-3 py-3 shadow-sm transition-shadow",
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
            {t("draftSceneRenderCta")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {!disabled ? (
            <PipelineStepAdvancedToggle open={advOpen} onToggle={() => setAdvOpen((p) => !p)} />
          ) : null}
          {showView && onView ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onView}
              aria-label={t("pipelineStepView")}
              title={t("pipelineStepView")}
              className="gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span className="hidden sm:inline">{t("pipelineStepView")}</span>
            </Button>
          ) : null}
          {hasFailures && !orchestrating ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRetryFailed}
              className="gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              {t("pipelineSceneRetryFailed")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={done ? "secondary" : "ghost"}
            size="sm"
            disabled={disabled || orchestrating}
            isLoading={orchestrating}
            onClick={onPrimary}
            aria-label={done ? t("pipelineStepRedo") : t("pipelineStepRun")}
            title={done ? t("pipelineStepRedo") : t("pipelineStepRun")}
            className="gap-1 px-2.5 sm:gap-1.5 sm:px-3"
          >
            {!orchestrating &&
              (done ? (
                <RotateCw className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              ))}
            <span className="hidden sm:inline">{done ? t("pipelineStepRedo") : t("pipelineStepRun")}</span>
          </Button>
        </div>
      </div>
      {!runwayRenderReady && !done && (
        <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
          {t("draftRunwayDisabledHint")}{" "}
        </p>
      )}
      {brandGuide?.trim() ? (
        <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
          {t("pipelineSceneBrandGuideOn")}
        </p>
      ) : null}
      {!disabled && estimatedRunwayCredits != null ? (
        <div className="mt-1.5 space-y-0.5 pl-7">
          <p className="text-[11px] font-medium text-text-secondary leading-snug">
            {t("pipelineSceneEstimatedCredits", { credits: estimatedRunwayCredits })}
          </p>
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            {t("pipelineSceneEstimatedCreditsDisclaimer")}
          </p>
        </div>
      ) : null}

      {showPlanTable && estimatedRunwayCredits != null ? (
        <div className="mt-2 pl-7 space-y-1.5">
          <p className="text-[10px] font-medium text-text-tertiary">
            {t("pipelineScenePlanTableCaption")}
          </p>
          <div className="max-w-full overflow-x-auto px-0.5 -mx-0.5">
            <table className="w-full min-w-[min(100%,22rem)] border-collapse text-left text-[11px] text-text-secondary">
              <thead>
                <tr className="border-b border-border-subtle/60 text-[10px] font-medium text-text-tertiary">
                  <th scope="col" className="py-1 pr-2 font-medium">
                    {t("pipelineSceneColScene")}
                  </th>
                  <th scope="col" className="py-1 pr-2 font-medium tabular-nums">
                    {t("pipelineSceneColDurationSec")}
                  </th>
                  <th scope="col" className="py-1 pr-2 font-medium tabular-nums">
                    {t("pipelineSceneColEstCredits")}
                  </th>
                  <th scope="col" className="py-1 pr-2 font-medium min-w-[7rem]">
                    {t("pipelineSceneColVisualPrompt")}
                  </th>
                  {hasSceneActivity ? (
                    <th scope="col" className="py-1 pl-1 font-medium text-right">
                      {t("pipelineSceneColStatus")}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {parsedSceneRowsForEstimate.map((row) => {
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
                  return (
                    <tr
                      key={row.index}
                      className="border-b border-border-subtle/35 last:border-b-0"
                    >
                      <td className="py-1 pr-2 align-top">
                        {t("pipelineSceneRowLabel", { index: row.index + 1 })}
                      </td>
                      <td className="py-1 pr-2 align-top tabular-nums">{row.durationSeconds}</td>
                      <td className="py-1 pr-2 align-top tabular-nums">~{perScene}</td>
                      <td
                        className="py-1 pr-2 align-top max-w-[10rem] truncate sm:max-w-[14rem]"
                        title={row.visualPrompt}
                      >
                        {row.visualPrompt}
                      </td>
                      {hasSceneActivity ? (
                        <td className="py-1 pl-1 align-top text-right">
                          {statusLabel ? (
                            <span
                              className={cn(
                                "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                                st === "ok"
                                  ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                  : st === "error"
                                    ? "bg-danger/15 text-danger"
                                    : st === "running"
                                      ? "bg-primary/15 text-primary"
                                      : "bg-layer-03 text-text-tertiary",
                              )}
                            >
                              {statusLabel}
                            </span>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border-subtle/60">
                  <td
                    colSpan={hasSceneActivity ? 5 : 4}
                    className="pt-1.5 text-[10px] text-text-tertiary text-right"
                  >
                    {t("pipelineScenePlanTableTotal", { credits: estimatedRunwayCredits })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}

      {!disabled ? (
        <form
          id={advId}
          className={cn(
            "mt-2 pl-7 space-y-2 border-t border-border-subtle/50 pt-2",
            !advOpen && "hidden",
          )}
        >
          <div>
            <label
              className="block text-[10px] font-medium text-text-tertiary mb-0.5"
              htmlFor={`${advId}-runway-model`}
            >
              {t("pipelineSceneRunwayVideoModelLabel")}
            </label>
            <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
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
                  "h-7 w-full min-w-0 max-w-full cursor-pointer appearance-none rounded border border-border-subtle bg-field",
                  "pl-2.5 pr-10 text-left text-[11px] text-text-primary",
                  "overflow-hidden text-ellipsis whitespace-nowrap",
                  "focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/25",
                )}
              >
                {RUNWAY_TEXT_TO_VIDEO_MODEL_IDS.map((id) => (
                  <option key={id} value={id}>
                    {t(RUNWAY_MODEL_LABEL_KEYS[id])}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 z-1 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary opacity-90"
                aria-hidden
              />
            </div>
          </div>
          <div>
            <label
              className="block text-[10px] font-medium text-text-tertiary mb-0.5"
              htmlFor={`${advId}-runway-suffix`}
            >
              {t("pipelineSceneRunwayVisualSuffixLabel")}
            </label>
            <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
              {t("pipelineSceneRunwayVisualSuffixHint")}
            </p>
            <textarea
              id={`${advId}-runway-suffix`}
              rows={2}
              maxLength={2000}
              value={visualPromptSuffix}
              onChange={(e) => setVisualPromptSuffix(e.target.value)}
              className="w-full rounded border border-border-subtle bg-field px-2 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary"
              placeholder={t("pipelineSceneRunwayVisualSuffixPlaceholder")}
            />
          </div>
          {packagingLlmReady ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  className="block text-[10px] font-medium text-text-tertiary mb-0.5"
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
                      "h-7 w-full min-w-0 max-w-full cursor-pointer appearance-none rounded border border-border-subtle bg-field",
                      "pl-2.5 pr-10 text-left text-[11px] text-text-primary",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      "focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/25",
                    )}
                  >
                    {packagingModelOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 z-1 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary opacity-90"
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
            <p className="text-[10px] text-text-tertiary leading-relaxed">{t("pipelineScenePlanLlmHint")}</p>
          ) : null}

          <div>
            <label className="block text-[10px] font-medium text-text-tertiary mb-0.5">
              {t("pipelineProduceTargetSceneCountLabel")}
            </label>
            <p className="text-[10px] text-text-tertiary mb-1 leading-relaxed">
              {t("pipelineProduceTargetSceneCountHint")}
            </p>
            <select
              name="target_scene_count"
              value={targetSceneCount}
              onChange={(e) => setTargetSceneCount(e.target.value)}
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
              rows={4}
              maxLength={50_000}
              value={scenesJsonControlled}
              onChange={(e) => setScenesJsonControlled(e.target.value)}
              placeholder={SCENES_JSON_INPUT_PLACEHOLDER}
              title={t("pipelineProduceScenesJsonPlaceholder")}
              className="w-full rounded border border-border-subtle bg-field px-2 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary font-mono"
            />
            <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-text-tertiary leading-relaxed">
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
        <ul className="mt-2 pl-7 space-y-1.5 border-t border-border-subtle/40 pt-2">
          <li className="text-[10px] text-text-tertiary leading-relaxed mb-1.5">
            {t("pipelineSceneRunwayQueueRefreshHint")}
          </li>
          <li className="text-[10px] font-medium text-text-tertiary mb-1">
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
                className="flex items-center justify-between gap-2 text-[11px] text-text-secondary"
              >
                <span className="min-w-0 truncate">
                  {t("pipelineSceneRowLabel", { index: idx + 1 })}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    st === "ok"
                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : st === "error"
                        ? "bg-danger/15 text-danger"
                        : st === "running"
                          ? "bg-primary/15 text-primary"
                          : "bg-layer-03 text-text-tertiary",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
