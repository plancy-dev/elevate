"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import {
  generateStudioEpisodeDraft,
  refineStudioEpisodeDraft,
  restoreStudioEpisodeDraftFromSnapshot,
  saveStudioEpisodeDraftManual,
  triggerRunwayRenderStub,
  triggerYoutubeUploadStub,
} from "@/actions/studio-episode-llm";
import {
  studioEpisodeLlmInitialState,
  type StudioEpisodeLlmDraftPayload,
} from "@/lib/studio-productions/episode-llm-ui";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import { EPISODE_DRAFT_ROLES } from "@/lib/studio-productions/constants";
import {
  ANTHROPIC_DRAFT_MODEL_OPTIONS,
  OPENAI_DRAFT_MODEL_OPTIONS,
  defaultDraftModel,
  type DraftModelCostTier,
  type StudioDraftLlmProvider,
} from "@/lib/studio-productions/episode-llm-models";
import type { StudioEpisodeDraftSnapshotRow } from "@/lib/studio-productions/draft-snapshots";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { cn } from "@/lib/utils";

/** Used when the parent omits availability so hooks never run fewer times than on the next render. */
const DEFAULT_DRAFT_LLM_AVAILABILITY = {
  openai: false,
  anthropic: false,
} as const;

function pickInitialProvider(availability: {
  openai: boolean;
  anthropic: boolean;
}): StudioDraftLlmProvider {
  if (availability.openai && !availability.anthropic) return "openai";
  if (!availability.openai && availability.anthropic) return "anthropic";
  return "openai";
}

function draftFromArtifacts(artifacts: StudioProductionArtifactRow[]) {
  const hook = artifacts.find((a) => a.artifact_role === "hook")?.content_text ?? "";
  const title = artifacts.find((a) => a.artifact_role === "title")?.content_text ?? "";
  const script_draft =
    artifacts.find((a) => a.artifact_role === "script_draft")?.content_text ?? "";
  return { hook, title, script_draft };
}

function draftLlmTierLabelKey(
  tier: DraftModelCostTier,
): "draftLlmTierLow" | "draftLlmTierMedium" | "draftLlmTierHigh" {
  switch (tier) {
    case "low":
      return "draftLlmTierLow";
    case "medium":
      return "draftLlmTierMedium";
    case "high":
      return "draftLlmTierHigh";
  }
}

function draftArtifactsSyncKey(artifacts: StudioProductionArtifactRow[]) {
  return EPISODE_DRAFT_ROLES.map((role) => {
    const row = artifacts.find((a) => a.artifact_role === role);
    return row ? `${row.id}:${row.created_at}` : `_:${role}`;
  }).join("|");
}

function FieldDiffBlock({
  fieldLabel,
  previous,
  next,
  prevColLabel,
  nextColLabel,
  unchangedLabel,
}: {
  fieldLabel: string;
  previous: string;
  next: string;
  prevColLabel: string;
  nextColLabel: string;
  unchangedLabel: string;
}) {
  const changed = previous.trim() !== next.trim();
  if (!changed) {
    return (
      <p className="text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">{fieldLabel}:</span>{" "}
        {unchangedLabel}
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-text-secondary">{fieldLabel}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border-subtle/80 bg-layer-02/40 p-2">
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1">
            {prevColLabel}
          </p>
          <pre className="text-xs text-text-secondary whitespace-pre-wrap wrap-break-word font-sans leading-relaxed max-h-40 overflow-y-auto">
            {previous || "—"}
          </pre>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/6 p-2">
          <p className="text-[10px] uppercase tracking-wide text-primary/90 mb-1">
            {nextColLabel}
          </p>
          <pre className="text-xs text-text-primary whitespace-pre-wrap wrap-break-word font-sans leading-relaxed max-h-40 overflow-y-auto">
            {next || "—"}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ProductionEpisodeDraftPanelEditable({
  episodeId,
  artifacts,
  draftLlmAvailability: draftLlmAvailabilityProp,
  draftSnapshots,
  className,
  embedded,
}: {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  /** When omitted, both providers are treated as unavailable (safe default for hooks). */
  draftLlmAvailability?: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots: StudioEpisodeDraftSnapshotRow[];
  className?: string;
  /** When true, omit outer card chrome (parent provides section boundaries). */
  embedded?: boolean;
}) {
  const draftLlmAvailability =
    draftLlmAvailabilityProp ?? DEFAULT_DRAFT_LLM_AVAILABILITY;

  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const format = useFormatter();
  const router = useRouter();
  const posthog = usePostHog();
  const draftSectionTitleId = useId();
  const posthogRef = useRef(posthog);
  const prevSavePending = useRef(false);
  const snapshotBeforeAi = useRef<StudioEpisodeLlmDraftPayload | null>(null);
  const processedAiResultId = useRef<string>("");
  const revertSaveRequested = useRef(false);

  const seed = draftFromArtifacts(artifacts);
  const [hook, setHook] = useState(seed.hook);
  const [title, setTitle] = useState(seed.title);
  const [scriptDraft, setScriptDraft] = useState(seed.script_draft);
  const [instruction, setInstruction] = useState("");
  const [draftBriefing, setDraftBriefing] = useState("");

  const [compareOpen, setCompareOpen] = useState(false);
  const [comparePrevious, setComparePrevious] =
    useState<StudioEpisodeLlmDraftPayload | null>(null);
  const [compareProposed, setCompareProposed] =
    useState<StudioEpisodeLlmDraftPayload | null>(null);

  const artifactSyncKey = useMemo(
    () => draftArtifactsSyncKey(artifacts),
    [artifacts],
  );

  useEffect(() => {
    posthogRef.current = posthog;
  }, [posthog]);

  // Re-seed from server only when draft artifacts change — not when compareOpen toggles.
  // Otherwise "Apply" sets local state, compare closes, and this effect would run with stale
  // props before router.refresh() lands, reverting the editor to the old saved draft.
  useEffect(() => {
    if (compareOpen) return;
    const s = draftFromArtifacts(artifacts);
    startTransition(() => {
      setHook(s.hook);
      setTitle(s.title);
      setScriptDraft(s.script_draft);
    });
    // compareOpen is intentionally omitted: closing the compare panel must not trigger a re-sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compareOpen read for guard only; deps = server truth
  }, [artifactSyncKey, artifacts]);

  const showProviderPicker =
    draftLlmAvailability.openai && draftLlmAvailability.anthropic;
  const llmReady =
    draftLlmAvailability.openai || draftLlmAvailability.anthropic;

  const [llmProvider, setLlmProvider] = useState<StudioDraftLlmProvider>(() =>
    pickInitialProvider(draftLlmAvailability),
  );
  const [llmModel, setLlmModel] = useState(() =>
    defaultDraftModel(pickInitialProvider(draftLlmAvailability)),
  );

  const effectiveProvider: StudioDraftLlmProvider = (() => {
    if (showProviderPicker) return llmProvider;
    if (draftLlmAvailability.openai) return "openai";
    if (draftLlmAvailability.anthropic) return "anthropic";
    return "openai";
  })();

  const modelOptions = useMemo(() => {
    const opts =
      effectiveProvider === "openai"
        ? OPENAI_DRAFT_MODEL_OPTIONS
        : ANTHROPIC_DRAFT_MODEL_OPTIONS;
    return opts.map((o) => ({
      value: o.id,
      label: `${o.id} — ${t(draftLlmTierLabelKey(o.costTier))} · ${o.pricingHint}`,
    }));
  }, [effectiveProvider, t]);

  const resolvedModel = useMemo(() => {
    const opts =
      effectiveProvider === "openai"
        ? OPENAI_DRAFT_MODEL_OPTIONS
        : ANTHROPIC_DRAFT_MODEL_OPTIONS;
    if (opts.some((o) => o.id === llmModel)) return llmModel;
    return defaultDraftModel(effectiveProvider);
  }, [effectiveProvider, llmModel]);

  const [genState, genAction, genPending] = useActionState(
    generateStudioEpisodeDraft,
    studioEpisodeLlmInitialState,
  );
  const [refState, refAction, refPending] = useActionState(
    refineStudioEpisodeDraft,
    studioEpisodeLlmInitialState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveStudioEpisodeDraftManual,
    studioEpisodeLlmInitialState,
  );
  const [rwState, rwAction, rwPending] = useActionState(
    triggerRunwayRenderStub,
    studioEpisodeLlmInitialState,
  );
  const [ytState, ytAction, ytPending] = useActionState(
    triggerYoutubeUploadStub,
    studioEpisodeLlmInitialState,
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreStudioEpisodeDraftFromSnapshot,
    studioEpisodeLlmInitialState,
  );

  const err =
    genState?.error ??
    refState?.error ??
    saveState?.error ??
    restoreState?.error ??
    rwState?.error ??
    ytState?.error;
  const ok =
    genState?.success ??
    refState?.success ??
    saveState?.success ??
    restoreState?.success ??
    undefined;

  /** Manual save only — generate/refine use the compare panel instead of a toast. */
  const successMsg = ok === "draftSaved" ? t("draftSuccessSaved") : null;

  function labelForSnapshotSource(source: string) {
    switch (source) {
      case "llm_generate":
        return t("draftHistorySourceLlmGenerate");
      case "llm_refine":
        return t("draftHistorySourceLlmRefine");
      case "user_save":
        return t("draftHistorySourceUserSave");
      case "restore":
        return t("draftHistorySourceRestore");
      case "superseded":
        return t("draftHistorySourceSuperseded");
      default:
        return source;
    }
  }

  useEffect(() => {
    const gen = genState?.success === "draftGenerated" && genState.draft ? genState : null;
    const ref = refState?.success === "draftRefined" && refState.draft ? refState : null;
    const pick = gen ?? ref;
    if (!pick?.draft) return;
    const proposed = pick.draft;
    const id = `${pick.success}:${JSON.stringify(proposed)}`;
    if (processedAiResultId.current === id) return;
    processedAiResultId.current = id;
    const prevSnap =
      snapshotBeforeAi.current ?? {
        hook: "",
        title: "",
        script_draft: "",
      };
    startTransition(() => {
      setComparePrevious(prevSnap);
      setCompareProposed(proposed);
      // Live editor must match server (new draft is already in artifacts); compareOpen blocks artifact sync.
      setHook(proposed.hook);
      setTitle(proposed.title);
      setScriptDraft(proposed.script_draft);
      setCompareOpen(true);
    });
    const base = { episode_id: episodeId };
    if (pick.success === "draftGenerated") {
      posthogRef.current?.capture(PostHogEvent.ELEVATE_STUDIO_EPISODE_DRAFT_GENERATED, base);
    } else {
      posthogRef.current?.capture(PostHogEvent.ELEVATE_STUDIO_EPISODE_DRAFT_REFINED, base);
    }
    router.refresh();
  }, [genState, refState, router, episodeId]);

  useEffect(() => {
    if (saveState?.success !== "draftSaved" || !revertSaveRequested.current) return;
    revertSaveRequested.current = false;
    startTransition(() => {
      setCompareOpen(false);
      setComparePrevious(null);
      setCompareProposed(null);
    });
    snapshotBeforeAi.current = null;
    router.refresh();
  }, [saveState, router]);

  useEffect(() => {
    const done =
      prevSavePending.current &&
      !savePending &&
      saveState?.success === "draftSaved";
    prevSavePending.current = savePending;
    if (done) {
      posthogRef.current?.capture(PostHogEvent.ELEVATE_STUDIO_EPISODE_DRAFT_SAVED_MANUAL, {
        episode_id: episodeId,
      });
    }
  }, [savePending, saveState?.success, episodeId]);

  useEffect(() => {
    if (restoreState?.success !== "draftSaved") return;
    router.refresh();
  }, [restoreState?.success, router]);

  return (
    <section
      aria-labelledby={draftSectionTitleId}
      className={cn(
        embedded
          ? "space-y-6"
          : "mb-10 rounded-2xl border border-border-subtle/90 bg-layer-01 p-6 shadow-sm space-y-6",
        className,
      )}
    >
      <div>
        <h2
          id={draftSectionTitleId}
          className={cn(
            "font-semibold text-text-primary mb-1",
            embedded ? "text-base tracking-tight" : "text-sm",
          )}
        >
          {t("draftPanelTitle")}
        </h2>
        <p className="text-xs text-text-tertiary leading-relaxed max-w-prose">
          {embedded ? t("draftSectionDescription") : t("draftPanelSubtitle")}
        </p>
      </div>

      {err ? (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
          role="alert"
        >
          {translateActionErrorMessage(err, tAction)}
        </p>
      ) : null}
      {successMsg ? (
        <p className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200/95">
          {successMsg}
        </p>
      ) : null}

      {compareOpen && comparePrevious && compareProposed ? (
        <div
          className="rounded-xl border border-primary/30 bg-primary/4 p-4 space-y-4"
          role="region"
          aria-labelledby={`draft_compare_heading_${episodeId}`}
        >
          <div>
            <h3
              id={`draft_compare_heading_${episodeId}`}
              className="text-sm font-semibold text-text-primary"
            >
              {t("draftCompareTitle")}
            </h3>
            <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
              {t("draftCompareSubtitle")}
            </p>
          </div>
          <div className="space-y-4">
            <FieldDiffBlock
              fieldLabel={t("draftHookLabel")}
              previous={comparePrevious.hook}
              next={compareProposed.hook}
              prevColLabel={t("draftCompareBefore")}
              nextColLabel={t("draftCompareAfter")}
              unchangedLabel={t("draftCompareUnchanged")}
            />
            <FieldDiffBlock
              fieldLabel={t("draftTitleLabel")}
              previous={comparePrevious.title}
              next={compareProposed.title}
              prevColLabel={t("draftCompareBefore")}
              nextColLabel={t("draftCompareAfter")}
              unchangedLabel={t("draftCompareUnchanged")}
            />
            <FieldDiffBlock
              fieldLabel={t("draftScriptLabel")}
              previous={comparePrevious.script_draft}
              next={compareProposed.script_draft}
              prevColLabel={t("draftCompareBefore")}
              nextColLabel={t("draftCompareAfter")}
              unchangedLabel={t("draftCompareUnchanged")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setHook(compareProposed.hook);
                setTitle(compareProposed.title);
                setScriptDraft(compareProposed.script_draft);
                setCompareOpen(false);
                setComparePrevious(null);
                setCompareProposed(null);
                snapshotBeforeAi.current = null;
                router.refresh();
              }}
            >
              {t("draftCompareApply")}
            </Button>
            <form
              action={saveAction}
              className="inline"
              onSubmit={() => {
                revertSaveRequested.current = true;
              }}
            >
              <input type="hidden" name="episode_id" value={episodeId} />
              <input type="hidden" name="hook" value={comparePrevious.hook} />
              <input type="hidden" name="title" value={comparePrevious.title} />
              <input type="hidden" name="script_draft" value={comparePrevious.script_draft} />
              <Button type="submit" variant="secondary" size="sm" isLoading={savePending}>
                {t("draftCompareRevert")}
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border-subtle/80 bg-layer-02/25 px-3 py-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {showProviderPicker ? (
            <div>
              <label
                className="block text-xs font-medium text-text-secondary mb-1.5"
                htmlFor={`draft_llm_provider_${episodeId}`}
              >
                {t("draftLlmProviderLabel")}
              </label>
              <FieldSelect
                id={`draft_llm_provider_${episodeId}`}
                name="llm_provider_visual"
                value={llmProvider}
                onChange={(e) => {
                  const p = e.target.value as StudioDraftLlmProvider;
                  setLlmProvider(p);
                  setLlmModel(defaultDraftModel(p));
                }}
                disabled={!llmReady}
                options={[
                  {
                    value: "openai",
                    label: t("draftLlmProviderOpenai"),
                    disabled: !draftLlmAvailability.openai,
                  },
                  {
                    value: "anthropic",
                    label: t("draftLlmProviderAnthropic"),
                    disabled: !draftLlmAvailability.anthropic,
                  },
                ]}
                controlSize="sm"
              />
            </div>
          ) : null}
          <div className={showProviderPicker ? "" : "sm:col-span-2"}>
            <label
              className="block text-xs font-medium text-text-secondary mb-1.5"
              htmlFor={`draft_llm_model_${episodeId}`}
            >
              {t("draftLlmModelLabel")}
            </label>
            <FieldSelect
              id={`draft_llm_model_${episodeId}`}
              name="llm_model_visual"
              value={resolvedModel}
              onChange={(e) => setLlmModel(e.target.value)}
              disabled={!llmReady}
              options={modelOptions}
              controlSize="sm"
            />
            <p className="mt-1.5 text-[11px] text-text-tertiary leading-snug">
              {t("draftLlmPricingFootnote")}
            </p>
          </div>
        </div>
      </div>

      <form
        action={genAction}
        className="space-y-3"
        onSubmit={() => {
          snapshotBeforeAi.current = {
            hook,
            title,
            script_draft: scriptDraft,
          };
        }}
      >
        <input type="hidden" name="episode_id" value={episodeId} />
        <input type="hidden" name="llm_provider" value={effectiveProvider} />
        <input type="hidden" name="llm_model" value={resolvedModel} />
        <div>
          <label
            className="block text-xs font-medium text-text-secondary mb-1.5"
            htmlFor={`draft_briefing_${episodeId}`}
          >
            {t("draftBriefingLabel")}
          </label>
          <textarea
            id={`draft_briefing_${episodeId}`}
            name="draft_briefing"
            rows={4}
            value={draftBriefing}
            onChange={(e) => setDraftBriefing(e.target.value)}
            placeholder={t("draftBriefingPlaceholder")}
            disabled={!llmReady}
            maxLength={12000}
            className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm placeholder:text-text-tertiary disabled:opacity-60"
          />
          <p className="mt-1.5 text-[11px] text-text-tertiary leading-snug">
            {t("draftBriefingHint")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={genPending}
            disabled={!llmReady}
          >
            {t("draftGenerate")}
          </Button>
        </div>
      </form>

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="episode_id" value={episodeId} />
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="draft_hook">
            {t("draftHookLabel")}
          </label>
          <textarea
            id="draft_hook"
            name="hook"
            rows={2}
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="draft_title">
            {t("draftTitleLabel")}
          </label>
          <input
            id="draft_title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium text-text-secondary mb-1"
            htmlFor="draft_script"
          >
            {t("draftScriptLabel")}
          </label>
          <textarea
            id="draft_script"
            name="script_draft"
            rows={8}
            value={scriptDraft}
            onChange={(e) => setScriptDraft(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" variant="primary" size="sm" isLoading={savePending}>
          {t("draftSaveManual")}
        </Button>
      </form>

      <form
        action={refAction}
        className="space-y-2"
        onSubmit={() => {
          snapshotBeforeAi.current = {
            hook,
            title,
            script_draft: scriptDraft,
          };
        }}
      >
        <input type="hidden" name="episode_id" value={episodeId} />
        <input type="hidden" name="llm_provider" value={effectiveProvider} />
        <input type="hidden" name="llm_model" value={resolvedModel} />
        <label className="block text-xs font-medium text-text-secondary" htmlFor="draft_instr">
          {t("draftRefineLabel")}
        </label>
        <textarea
          id="draft_instr"
          name="instruction"
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={t("draftRefinePlaceholder")}
          className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          isLoading={refPending}
          disabled={!llmReady}
        >
          {t("draftRefineSubmit")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
        <form
          action={rwAction}
          onSubmit={() =>
            posthog?.capture(PostHogEvent.ELEVATE_STUDIO_EPISODE_RUNWAY_STUB_CLICKED, {
              episode_id: episodeId,
            })
          }
        >
          <input type="hidden" name="episode_id" value={episodeId} />
          <Button type="submit" variant="ghost" size="sm" isLoading={rwPending}>
            {t("draftRunwayCta")}
          </Button>
        </form>
        <form
          action={ytAction}
          onSubmit={() =>
            posthog?.capture(PostHogEvent.ELEVATE_STUDIO_EPISODE_YOUTUBE_UPLOAD_STUB_CLICKED, {
              episode_id: episodeId,
            })
          }
        >
          <input type="hidden" name="episode_id" value={episodeId} />
          <Button type="submit" variant="ghost" size="sm" isLoading={ytPending}>
            {t("draftYoutubeCta")}
          </Button>
        </form>
      </div>

      <div className="border-t border-border-subtle pt-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{t("draftHistoryTitle")}</h3>
          <p className="mt-1 text-xs text-text-tertiary leading-relaxed">{t("draftHistorySubtitle")}</p>
        </div>
        {draftSnapshots.length === 0 ? (
          <p className="text-xs text-text-tertiary">{t("draftHistoryEmpty")}</p>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {draftSnapshots.map((row) => {
              const preview = [row.hook, row.title].filter(Boolean).join(" · ").trim() || row.script_draft;
              const clipped = preview.length > 140 ? `${preview.slice(0, 140)}…` : preview;
              const when = format.dateTime(new Date(row.created_at), {
                dateStyle: "medium",
                timeStyle: "short",
              });
              return (
                <li
                  key={row.id}
                  className="rounded-lg border border-border-subtle/80 bg-layer-02/20 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                        {when} · {labelForSnapshotSource(row.source)}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary line-clamp-2 whitespace-pre-wrap wrap-break-word">
                        {clipped || "—"}
                      </p>
                    </div>
                    <form action={restoreAction} className="shrink-0">
                      <input type="hidden" name="episode_id" value={episodeId} />
                      <input type="hidden" name="snapshot_id" value={row.id} />
                      <Button type="submit" variant="secondary" size="sm" isLoading={restorePending}>
                        {t("draftHistoryRestore")}
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export function ProductionEpisodeDraftPanel({
  episodeId,
  artifacts,
  canEdit,
  draftLlmAvailability,
  draftSnapshots = [],
  className,
  embedded = false,
}: {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  canEdit: boolean;
  draftLlmAvailability?: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots?: StudioEpisodeDraftSnapshotRow[];
  className?: string;
  /** Single-column episode workspace: no outer card; section titles match parent rhythm. */
  embedded?: boolean;
}) {
  const t = useTranslations("Dashboard.productions");

  if (!canEdit) {
    return (
      <section
        className={cn(
          embedded ? "space-y-2" : "mb-10 rounded-2xl border border-border-subtle/90 bg-layer-01 p-6 shadow-sm",
          className,
        )}
      >
        <h2
          className={cn(
            "font-semibold text-text-primary mb-2",
            embedded ? "text-base tracking-tight" : "text-sm",
          )}
        >
          {t("draftPanelTitle")}
        </h2>
        <p className="text-sm text-text-tertiary">{t("draftPanelReadOnly")}</p>
      </section>
    );
  }

  return (
    <ProductionEpisodeDraftPanelEditable
      key={episodeId}
      episodeId={episodeId}
      artifacts={artifacts}
      draftLlmAvailability={draftLlmAvailability}
      draftSnapshots={draftSnapshots}
      className={className}
      embedded={embedded}
    />
  );
}
