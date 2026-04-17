"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "@/lib/ui/app-toast";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import {
  generateStudioEpisodeDraft,
  refineStudioEpisodeDraft,
  restoreStudioEpisodeDraftFromSnapshot,
  saveStudioEpisodeDraftManual,
} from "@/actions/studio-episode-llm";
import {
  studioEpisodeLlmInitialState,
  type StudioEpisodeLlmActionState,
  type StudioEpisodeLlmDraftPayload,
} from "@/lib/studio-productions/episode-llm-ui";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import {
  draftArtifactSyncKey,
  draftTripleFromArtifacts,
} from "@/lib/studio-productions/resolve-episode-draft-artifacts";
import { PenLine, Sparkles, Wand2 } from "lucide-react";
import {
  ANTHROPIC_DRAFT_MODEL_OPTIONS,
  OPENAI_DRAFT_MODEL_OPTIONS,
  defaultDraftModel,
  defaultStudioDraftLlmProvider,
  draftModelProviderFromModelId,
  resolveDraftModel,
  type DraftModelCostTier,
  type StudioDraftLlmProvider,
} from "@/lib/studio-productions/episode-llm-models";
import type { StudioEpisodeDraftSnapshotRow } from "@/lib/studio-productions/draft-snapshots";
import {
  CUSTOM_DRAFT_TEMPLATE_PREFIX,
  DEFAULT_DRAFT_TEMPLATE_KEY,
  DRAFT_TEMPLATE_KEYS,
  type DraftTemplateKey,
} from "@/lib/studio-productions/draft-prompt-templates";
import type { StudioEpisodeDraftTemplateRow } from "@/lib/data/studio-draft-templates";
import { DraftTemplateManageDialog } from "@/components/dashboard/draft-template-manage-dialog";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { cn } from "@/lib/utils";

/** Used when the parent omits availability so hooks never run fewer times than on the next render. */
const DEFAULT_DRAFT_LLM_AVAILABILITY = {
  openai: false,
  anthropic: false,
} as const;

type DialogWorkbenchTab = "generate" | "refine" | "editor";

const DRAFT_TEMPLATE_LABEL_KEYS: Record<
  DraftTemplateKey,
  | "draftTemplateOptionDefault"
  | "draftTemplateOptionPunchyShorts"
  | "draftTemplateOptionStoryEducational"
  | "draftTemplateOptionSoftCta"
> = {
  default: "draftTemplateOptionDefault",
  punchy_shorts: "draftTemplateOptionPunchyShorts",
  story_educational: "draftTemplateOptionStoryEducational",
  soft_cta: "draftTemplateOptionSoftCta",
};

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

export type EpisodeDraftWorkbenchProps = {
  variant: "panel" | "dialog";
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  customDraftTemplates: StudioEpisodeDraftTemplateRow[];
  draftLlmAvailability?: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots: StudioEpisodeDraftSnapshotRow[];
  className?: string;
  embedded?: boolean;
  afterRefineSlot?: ReactNode;
  footerSlot?: ReactNode;
  scriptTextareaRows?: number;
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * Pipeline tab shortcut: when the dialog opens with a non-null prefill, apply model + briefing.
   * Bump `pipelineShortcutNonce` each time so the effect can re-run for a new open.
   */
  pipelineShortcutPrefill?: { modelId: string; briefing: string } | null;
  pipelineShortcutNonce?: number;
};

export function EpisodeDraftWorkbench({
  variant,
  episodeId,
  artifacts,
  customDraftTemplates,
  draftLlmAvailability: draftLlmAvailabilityProp,
  draftSnapshots,
  className,
  embedded,
  afterRefineSlot,
  footerSlot,
  scriptTextareaRows = 8,
  onDirtyChange,
  pipelineShortcutPrefill = null,
  pipelineShortcutNonce = 0,
}: EpisodeDraftWorkbenchProps) {
  const draftLlmAvailability =
    draftLlmAvailabilityProp ?? DEFAULT_DRAFT_LLM_AVAILABILITY;

  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const format = useFormatter();
  const router = useRouter();
  const posthog = usePostHog();
  const draftSectionTitleId = useId();
  const fieldIds = useMemo(() => {
    if (variant === "dialog") {
      const p = `pd-${episodeId}`;
      return {
        hook: `${p}-hook`,
        title: `${p}-title`,
        script: `${p}-script`,
        instr: `${p}-instr`,
        briefing: `${p}-briefing`,
        llmProvider: `${p}-llm-p`,
        llmModel: `${p}-llm-m`,
        template: `${p}-tpl`,
        compareHeading: `${p}-compare-h`,
      };
    }
    return {
      hook: "draft_hook",
      title: "draft_title",
      script: "draft_script",
      instr: "draft_instr",
      briefing: `draft_briefing_${episodeId}`,
      llmProvider: `draft_llm_provider_${episodeId}`,
      llmModel: `draft_llm_model_${episodeId}`,
      template: `draft_template_${episodeId}`,
      compareHeading: `draft_compare_heading_${episodeId}`,
    };
  }, [variant, episodeId]);

  const posthogRef = useRef(posthog);
  const prevSavePending = useRef(false);
  const snapshotBeforeAi = useRef<StudioEpisodeLlmDraftPayload | null>(null);
  const processedAiResultId = useRef<string>("");
  const processedSaveStateRef = useRef<StudioEpisodeLlmActionState>(undefined);
  const processedRestoreStateRef = useRef<StudioEpisodeLlmActionState>(undefined);
  const revertSaveRequested = useRef(false);
  const applyFromCompareRef = useRef(false);

  const seed = draftTripleFromArtifacts(artifacts);
  const [hook, setHook] = useState(seed.hook);
  const [title, setTitle] = useState(seed.title);
  const [scriptDraft, setScriptDraft] = useState(seed.script_draft);
  const [instruction, setInstruction] = useState("");
  const [draftBriefing, setDraftBriefing] = useState("");
  const [draftTemplateSelection, setDraftTemplateSelection] = useState<string>(
    DEFAULT_DRAFT_TEMPLATE_KEY,
  );

  const [compareOpen, setCompareOpen] = useState(false);
  const [comparePrevious, setComparePrevious] =
    useState<StudioEpisodeLlmDraftPayload | null>(null);
  const [compareProposed, setCompareProposed] =
    useState<StudioEpisodeLlmDraftPayload | null>(null);

  const [localCustomDraftTemplates, setLocalCustomDraftTemplates] =
    useState<StudioEpisodeDraftTemplateRow[]>(customDraftTemplates);
  useEffect(() => {
    setLocalCustomDraftTemplates(customDraftTemplates);
  }, [customDraftTemplates]);


  const artifactSyncKey = useMemo(() => draftArtifactSyncKey(artifacts), [artifacts]);

  useEffect(() => {
    if (!onDirtyChange) return;
    const synced = draftTripleFromArtifacts(artifacts);
    const dirty =
      compareOpen ||
      hook !== synced.hook ||
      title !== synced.title ||
      scriptDraft !== synced.script_draft;
    onDirtyChange(dirty);
  }, [onDirtyChange, compareOpen, hook, title, scriptDraft, artifacts, artifactSyncKey]);


  useEffect(() => {
    posthogRef.current = posthog;
  }, [posthog]);

  // Re-seed from server only when draft artifacts change — not when compareOpen toggles.
  // Otherwise "Apply" sets local state, compare closes, and this effect would run with stale
  // props before router.refresh() lands, reverting the editor to the old saved draft.
  useEffect(() => {
    if (compareOpen) return;
    const s = draftTripleFromArtifacts(artifacts);
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
    defaultStudioDraftLlmProvider(draftLlmAvailability),
  );
  const [llmModel, setLlmModel] = useState(() =>
    defaultDraftModel(defaultStudioDraftLlmProvider(draftLlmAvailability)),
  );
  const [dialogTab, setDialogTab] = useState<DialogWorkbenchTab>("generate");
  const [draftGenerateMode, setDraftGenerateMode] = useState<"develop" | "fresh">(
    "develop",
  );

  useEffect(() => {
    if (variant !== "dialog") return;
    if (!pipelineShortcutPrefill) return;
    const { modelId, briefing } = pipelineShortcutPrefill;
    const trimmedBrief = briefing.trim();
    const id = modelId.trim();
    if (id) {
      const p = draftModelProviderFromModelId(id);
      if (p === "openai" && draftLlmAvailability.openai) {
        setLlmProvider("openai");
        setLlmModel(resolveDraftModel("openai", id));
      } else if (p === "anthropic" && draftLlmAvailability.anthropic) {
        setLlmProvider("anthropic");
        setLlmModel(resolveDraftModel("anthropic", id));
      }
    }
    if (trimmedBrief) {
      setDraftBriefing(trimmedBrief);
    }
  }, [
    variant,
    pipelineShortcutNonce,
    pipelineShortcutPrefill,
    draftLlmAvailability.openai,
    draftLlmAvailability.anthropic,
  ]);

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
      label: o.id,
    }));
  }, [effectiveProvider]);

  const draftTemplateOptions = useMemo(() => {
    const seeds = DRAFT_TEMPLATE_KEYS.map((k) => ({
      value: k,
      label: t(DRAFT_TEMPLATE_LABEL_KEYS[k]),
    }));
    const customs = localCustomDraftTemplates.map((row) => ({
      value: `${CUSTOM_DRAFT_TEMPLATE_PREFIX}${row.id}`,
      label: row.name,
    }));
    return [...seeds, ...customs];
  }, [t, localCustomDraftTemplates]);

  useEffect(() => {
    if (!draftTemplateSelection.startsWith(CUSTOM_DRAFT_TEMPLATE_PREFIX)) return;
    const id = draftTemplateSelection.slice(CUSTOM_DRAFT_TEMPLATE_PREFIX.length);
    if (localCustomDraftTemplates.some((row) => row.id === id)) return;
    setDraftTemplateSelection(DEFAULT_DRAFT_TEMPLATE_KEY);
  }, [localCustomDraftTemplates, draftTemplateSelection]);

  const resolvedModel = useMemo(() => {
    const opts =
      effectiveProvider === "openai"
        ? OPENAI_DRAFT_MODEL_OPTIONS
        : ANTHROPIC_DRAFT_MODEL_OPTIONS;
    if (opts.some((o) => o.id === llmModel)) return llmModel;
    return defaultDraftModel(effectiveProvider);
  }, [effectiveProvider, llmModel]);

  const resolvedModelMeta = useMemo(() => {
    const opts =
      effectiveProvider === "openai"
        ? OPENAI_DRAFT_MODEL_OPTIONS
        : ANTHROPIC_DRAFT_MODEL_OPTIONS;
    return opts.find((o) => o.id === resolvedModel) ?? null;
  }, [effectiveProvider, resolvedModel]);

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
  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreStudioEpisodeDraftFromSnapshot,
    studioEpisodeLlmInitialState,
  );

  const err =
    genState?.error ??
    refState?.error ??
    saveState?.error ??
    restoreState?.error;

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
    if (saveState?.success !== "draftSaved") return;
    if (processedSaveStateRef.current === saveState) return;
    processedSaveStateRef.current = saveState;

    if (applyFromCompareRef.current) {
      applyFromCompareRef.current = false;
      toast.success(t("draftSuccessSaved"));
      const applied = compareProposed;
      startTransition(() => {
        if (applied) {
          setHook(applied.hook);
          setTitle(applied.title);
          setScriptDraft(applied.script_draft);
        }
        setCompareOpen(false);
        setComparePrevious(null);
        setCompareProposed(null);
      });
      snapshotBeforeAi.current = null;
      router.refresh();
      return;
    }

    if (revertSaveRequested.current) {
      revertSaveRequested.current = false;
      toast.success(t("draftSuccessSaved"));
      startTransition(() => {
        setCompareOpen(false);
        setComparePrevious(null);
        setCompareProposed(null);
      });
      snapshotBeforeAi.current = null;
      router.refresh();
      return;
    }

    toast.success(t("draftSuccessSaved"));
    router.refresh();
  }, [saveState, router, t, compareProposed]);

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
    if (processedRestoreStateRef.current === restoreState) return;
    processedRestoreStateRef.current = restoreState;
    toast.success(t("draftSnapshotRestoredToast"));
    router.refresh();
  }, [restoreState, router, t]);

  const panelHeader = (
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
  );

  const mainBlocks = (
    <>
{err ? (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
          role="alert"
        >
          {translateActionErrorMessage(err, tAction)}
        </p>
      ) : null}
      {compareOpen && comparePrevious && compareProposed ? (
        <div
          className="rounded-xl border border-primary/30 bg-primary/4 p-4 space-y-4"
          role="region"
          aria-labelledby={fieldIds.compareHeading}
        >
          <div>
            <h3
              id={fieldIds.compareHeading}
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
            <form
              action={saveAction}
              className="inline"
              onSubmit={() => {
                applyFromCompareRef.current = true;
              }}
            >
              <input type="hidden" name="episode_id" value={episodeId} />
              <input type="hidden" name="hook" value={compareProposed.hook} />
              <input type="hidden" name="title" value={compareProposed.title} />
              <input type="hidden" name="script_draft" value={compareProposed.script_draft} />
              <Button type="submit" variant="primary" size="sm" isLoading={savePending}>
                {t("draftCompareApply")}
              </Button>
            </form>
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

      <div className="rounded-xl border border-border-subtle/80 bg-layer-02/30 px-3 py-2.5">
        <div
          className={cn(
            "grid gap-2.5 items-end",
            showProviderPicker ? "sm:grid-cols-2" : "sm:grid-cols-1",
          )}
        >
          {showProviderPicker ? (
            <div className="min-w-0">
              <label
                className="block text-[11px] font-medium text-text-tertiary mb-1"
                htmlFor={fieldIds.llmProvider}
              >
                {t("draftLlmProviderLabel")}
              </label>
              <FieldSelect
                id={fieldIds.llmProvider}
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
          <div className={cn("min-w-0", !showProviderPicker && "sm:col-span-2")}>
            <label
              className="block text-[11px] font-medium text-text-tertiary mb-1"
              htmlFor={fieldIds.llmModel}
            >
              {t("draftLlmModelLabel")}
            </label>
            <FieldSelect
              id={fieldIds.llmModel}
              name="llm_model_visual"
              value={resolvedModel}
              onChange={(e) => setLlmModel(e.target.value)}
              disabled={!llmReady}
              options={modelOptions}
              controlSize="sm"
            />
            {resolvedModelMeta ? (
              <p className="mt-1 text-[10px] text-text-tertiary tabular-nums">
                {t(draftLlmTierLabelKey(resolvedModelMeta.costTier))} ·{" "}
                {resolvedModelMeta.pricingHint}
              </p>
            ) : null}
            <details className="mt-1.5 group">
              <summary className="cursor-pointer list-none text-[11px] text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline [&::-webkit-details-marker]:hidden">
                {t("draftLlmPricingDetailsSummary")}
              </summary>
              <p className="mt-1.5 text-[11px] text-text-tertiary leading-relaxed">
                {t("draftLlmPricingFootnote")}
              </p>
            </details>
          </div>
        </div>
      </div>

      {variant === "dialog" ? (
        <div
          role="tablist"
          aria-label={t("draftDialogTablistAria")}
          className="flex flex-wrap gap-1 rounded-xl border border-border-subtle/70 bg-layer-02/40 p-1"
        >
          {(
            [
              { id: "generate" as const, label: t("draftDialogTabGenerate"), icon: Sparkles },
              { id: "refine" as const, label: t("draftDialogTabRefine"), icon: Wand2 },
              { id: "editor" as const, label: t("draftDialogTabEditor"), icon: PenLine },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={dialogTab === id}
              onClick={() => setDialogTab(id)}
              className={cn(
                "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors sm:flex-none sm:px-3",
                dialogTab === id
                  ? "bg-layer-01 text-text-primary shadow-sm ring-1 ring-border-subtle/80"
                  : "text-text-secondary hover:bg-layer-01/60 hover:text-text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {(variant === "dialog" ? dialogTab === "generate" : true) ? (
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
          <input type="hidden" name="draft_generate_mode" value={draftGenerateMode} />
          <div className="space-y-2 rounded-lg border border-border-subtle/70 bg-layer-02/20 p-3">
            <p className="text-[11px] font-medium text-text-secondary">
              {t("draftGenerateModeLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!llmReady}
                onClick={() => setDraftGenerateMode("develop")}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                  draftGenerateMode === "develop"
                    ? "border-primary/40 bg-primary/10 text-text-primary ring-1 ring-primary/25"
                    : "border-border-subtle/80 bg-field text-text-secondary hover:bg-layer-02",
                )}
              >
                {t("draftGenerateModeDevelop")}
              </button>
              <button
                type="button"
                disabled={!llmReady}
                onClick={() => setDraftGenerateMode("fresh")}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                  draftGenerateMode === "fresh"
                    ? "border-primary/40 bg-primary/10 text-text-primary ring-1 ring-primary/25"
                    : "border-border-subtle/80 bg-field text-text-secondary hover:bg-layer-02",
                )}
              >
                {t("draftGenerateModeFresh")}
              </button>
            </div>
            <details className="text-[11px] text-text-tertiary">
              <summary className="cursor-pointer text-text-tertiary hover:text-text-secondary">
                {t("draftMoreDetails")}
              </summary>
              <p className="mt-1.5 leading-relaxed">{t("draftGenerateModeHint")}</p>
            </details>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label
                className="block text-xs font-medium text-text-secondary"
                htmlFor={fieldIds.template}
              >
                {t("draftTemplateLabel")}
              </label>
              <DraftTemplateManageDialog
                templates={localCustomDraftTemplates}
                onTemplatesChange={setLocalCustomDraftTemplates}
              />
            </div>
            <FieldSelect
              id={fieldIds.template}
              name="draft_template_key"
              value={draftTemplateSelection}
              onChange={(e) => setDraftTemplateSelection(e.target.value)}
              options={draftTemplateOptions}
              controlSize="sm"
              disabled={!llmReady}
            />
            <details className="mt-1.5 text-[11px] text-text-tertiary">
              <summary className="cursor-pointer hover:text-text-secondary">{t("draftMoreDetails")}</summary>
              <p className="mt-1.5 leading-snug">{t("draftTemplateHint")}</p>
            </details>
          </div>
          <div>
            <label
              className="block text-xs font-medium text-text-secondary mb-1.5"
              htmlFor={fieldIds.briefing}
            >
              {t("draftBriefingLabel")}
            </label>
            <textarea
              id={fieldIds.briefing}
              name="draft_briefing"
              rows={variant === "dialog" ? 3 : 4}
              value={draftBriefing}
              onChange={(e) => setDraftBriefing(e.target.value)}
              placeholder={t("draftBriefingPlaceholder")}
              disabled={!llmReady}
              maxLength={12000}
              className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm placeholder:text-text-tertiary disabled:opacity-60"
            />
            <details className="mt-1.5 text-[11px] text-text-tertiary">
              <summary className="cursor-pointer hover:text-text-secondary">{t("draftMoreDetails")}</summary>
              <p className="mt-1.5 leading-snug">{t("draftBriefingHint")}</p>
            </details>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            <Button
              type="submit"
              variant={variant === "dialog" ? "primary" : "secondary"}
              size="sm"
              isLoading={genPending}
              disabled={!llmReady}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 opacity-90" aria-hidden />
              {t("draftGenerate")}
            </Button>
          </div>
        </form>
      ) : null}

      {(variant === "dialog" ? dialogTab === "editor" : true) ? (
        <form action={saveAction} className="space-y-3">
          <input type="hidden" name="episode_id" value={episodeId} />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor={fieldIds.hook}>
              {t("draftHookLabel")}
            </label>
            <textarea
              id={fieldIds.hook}
              name="hook"
              rows={2}
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor={fieldIds.title}>
              {t("draftTitleLabel")}
            </label>
            <input
              id={fieldIds.title}
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium text-text-secondary mb-1"
              htmlFor={fieldIds.script}
            >
              {t("draftScriptLabel")}
            </label>
            <textarea
              id={fieldIds.script}
              name="script_draft"
              rows={scriptTextareaRows}
              value={scriptDraft}
              onChange={(e) => setScriptDraft(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" isLoading={savePending}>
            {t("draftSaveManual")}
          </Button>
        </form>
      ) : null}

      {(variant === "dialog" ? dialogTab === "refine" : true) ? (
        <form
          action={refAction}
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
          <label className="block text-xs font-medium text-text-secondary" htmlFor={fieldIds.instr}>
            {t("draftRefineLabel")}
          </label>
          <textarea
            id={fieldIds.instr}
            name="instruction"
            rows={variant === "dialog" ? 4 : 2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={t("draftRefinePlaceholder")}
            className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm"
          />
          <Button
            type="submit"
            variant={variant === "dialog" ? "primary" : "secondary"}
            size="sm"
            isLoading={refPending}
            disabled={!llmReady}
            className="gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5 opacity-90" aria-hidden />
            {t("draftRefineSubmit")}
          </Button>
        </form>
      ) : null}

      {afterRefineSlot}

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
    </>
  );

  if (variant === "dialog") {
    return (
      <div className={cn("space-y-6", className)}>
        {mainBlocks}
        {footerSlot}
      </div>
    );
  }

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
      {panelHeader}
      {mainBlocks}
    </section>
  );
}
