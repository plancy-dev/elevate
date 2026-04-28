"use client";

import {
  BookMarked,
  Clapperboard,
  ClipboardList,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Fragment,
  Suspense,
  useCallback,
  useId,
  useRef,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ProductionEpisodePipeline } from "@/components/dashboard/production-episode-pipeline";
import { ProductionEpisodeReferencePanel } from "@/components/dashboard/production-episode-reference-panel";
import { ProductionEpisodeScenesOverview } from "@/components/dashboard/production-episode-scenes-overview";
import {
  StudioProductionsDeleteEpisodeForm,
  StudioProductionsEpisodeEditForm,
} from "@/components/dashboard/studio-productions-forms";
import type { StudioEpisodeDraftTemplateRow } from "@/lib/data/studio-draft-templates";
import type {
  StudioProductionArtifactRow,
  StudioProductionEpisodeRowWithEmbeds,
} from "@/lib/data/studio-productions";
import type { StudioEpisodeDraftSnapshotRow } from "@/lib/studio-productions/draft-snapshots";
import type { EpisodeScenePlanRow } from "@/lib/studio-productions/episode-scene-plan-dto";
import {
  DEFAULT_EPISODE_DETAIL_PANEL,
  EPISODE_DETAIL_PANEL_IDS,
  type EpisodeDetailPanelId,
  parseEpisodeDetailPanelParam,
} from "@/lib/studio-productions/episode-detail-panel";
import type { StudioEpisodeStatus } from "@/lib/studio-productions/constants";
import { distributionDisplayLabel } from "@/lib/studio-productions/distribution";
import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";
import { cn } from "@/lib/utils";

const STATUS_I18N: Record<
  StudioEpisodeStatus,
  | "statusDraft"
  | "statusReady"
  | "statusPublished"
  | "statusArchived"
> = {
  draft: "statusDraft",
  ready: "statusReady",
  published: "statusPublished",
  archived: "statusArchived",
};

const TAB_ICONS: Record<EpisodeDetailPanelId, LucideIcon> = {
  references: BookMarked,
  pipeline: Clapperboard,
  detail: ClipboardList,
};

const TAB_LABEL_KEYS: Record<
  EpisodeDetailPanelId,
  "episodeSubtabReferences" | "episodeSubtabPipeline" | "episodeSubtabDetail"
> = {
  references: "episodeSubtabReferences",
  pipeline: "episodeSubtabPipeline",
  detail: "episodeSubtabDetail",
};

/** Vertical rule after these tabs: Plan | Produce | Admin */
const TAB_DIVIDER_AFTER: EpisodeDetailPanelId[] = ["references", "pipeline"];

type ProjectOpt = { id: string; name: string };

function EpisodePanelIntro({
  phaseKey,
  titleKey,
  bodyKey,
}: {
  phaseKey: "episodePhasePlan" | "episodePhaseProduce" | "episodePhaseAdmin";
  titleKey:
    | "episodePanelHeadReferences"
    | "episodePanelHeadProduce"
    | "episodePanelHeadEpisode";
  bodyKey:
    | "episodePanelBodyReferences"
    | "episodePanelBodyProduce"
    | "episodePanelBodyEpisode";
}) {
  const t = useTranslations("Dashboard.productions");
  return (
    <div className="mb-6 max-w-prose">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
        {t(phaseKey)}
      </p>
      <h2 className="mt-1.5 text-base font-semibold tracking-tight text-ink-900">
        {t(titleKey)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{t(bodyKey)}</p>
    </div>
  );
}

function ProductionEpisodeDetailWorkspaceInner({
  episode,
  studioProjects,
  artifacts,
  canEditDraft,
  customDraftTemplates,
  draftLlmAvailability,
  draftSnapshots,
  runwayRenderReady,
  elevenlabsKeyConfigured,
  openaiKeyConfigured,
  packagingLlmReady,
  helpSection,
  youtubeChannelTitle,
  episodeFormat,
  distributionChannelLabel,
  activeAssemblyJob,
  brandGuide,
  scenePlanRows,
  sceneKeyframesSlot,
}: {
  episode: StudioProductionEpisodeRowWithEmbeds;
  studioProjects: ProjectOpt[];
  artifacts: StudioProductionArtifactRow[];
  canEditDraft: boolean;
  customDraftTemplates: StudioEpisodeDraftTemplateRow[];
  draftLlmAvailability: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots: StudioEpisodeDraftSnapshotRow[];
  runwayRenderReady: boolean;
  elevenlabsKeyConfigured: boolean;
  /** OpenAI key saved (DALL·E thumbnail + optional OpenAI draft). */
  openaiKeyConfigured: boolean;
  packagingLlmReady: boolean;
  helpSection: ReactNode;
  youtubeChannelTitle: string | null;
  episodeFormat: EpisodeFormat;
  distributionChannelLabel: string | null;
  activeAssemblyJob?: { id: string; status: string } | null;
  brandGuide?: string | null;
  /** Parsed `pipeline_prefs.sceneRender.scenesJson` (null if empty/invalid). */
  scenePlanRows: EpisodeScenePlanRow[] | null;
  /**
   * Server-rendered scene keyframe gallery (ADR-009). Rendered inside the
   * pipeline panel above `ProductionEpisodePipeline`.
   */
  sceneKeyframesSlot?: ReactNode;
}) {
  const t = useTranslations("Dashboard.productions");
  const baseId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** URL is source of truth — avoids duplicate setState + rAF resync when switching subtabs quickly. */
  const panel: EpisodeDetailPanelId =
    parseEpisodeDetailPanelParam(searchParams.get("episodePanel")) ??
    DEFAULT_EPISODE_DETAIL_PANEL;
  const [, startPanelUrlTransition] = useTransition();
  const tabButtonRefs = useRef<
    Partial<Record<EpisodeDetailPanelId, HTMLButtonElement | null>>
  >({});

  const setPanelAndUrl = useCallback(
    (next: EpisodeDetailPanelId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        parseEpisodeDetailPanelParam(params.get("episodePanel")) === next &&
        params.get("tab") === "episode"
      ) {
        return;
      }
      params.set("tab", "episode");
      params.set("episodePanel", next);
      const href = `${pathname}?${params.toString()}`;
      startPanelUrlTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const onSubtabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "Home" &&
        e.key !== "End"
      ) {
        return;
      }
      const i = EPISODE_DETAIL_PANEL_IDS.indexOf(panel);
      if (i < 0) return;
      e.preventDefault();
      let nextIdx = i;
      if (e.key === "ArrowLeft") {
        nextIdx =
          (i - 1 + EPISODE_DETAIL_PANEL_IDS.length) %
          EPISODE_DETAIL_PANEL_IDS.length;
      } else if (e.key === "ArrowRight") {
        nextIdx = (i + 1) % EPISODE_DETAIL_PANEL_IDS.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = EPISODE_DETAIL_PANEL_IDS.length - 1;
      }
      const nextId = EPISODE_DETAIL_PANEL_IDS[nextIdx];
      setPanelAndUrl(nextId);
      requestAnimationFrame(() => {
        tabButtonRefs.current[nextId]?.focus();
      });
    },
    [panel, setPanelAndUrl],
  );

  const statusKey =
    STATUS_I18N[episode.status as StudioEpisodeStatus] ?? "statusDraft";
  const channelLine = episode.distribution_label
    ? distributionDisplayLabel(episode.distribution_label, (key) =>
        t(key as never),
      )
    : null;
  const linkedChannel = episode.studio_distribution_channels;

  return (
    <article className="mb-6 overflow-hidden border border-ink-100 bg-paper-100">
      <header className="flex flex-col gap-3 border-b border-ink-100 bg-paper-50 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
              {episode.title}
            </h1>
            <span className="border border-vermilion-600/30 bg-paper-0 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-vermilion-600">
              {t(statusKey)}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {channelLine ? (
              <p className="text-sm text-ink-700">{channelLine}</p>
            ) : null}
            {linkedChannel ? (
              <a
                href={linkedChannel.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1.5 border border-ink-100 bg-paper-100 px-3 py-1.5 text-sm font-medium text-vermilion-600 hover:border-ink-900"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                {t("episodeChannelCta", { label: linkedChannel.label })}
              </a>
            ) : null}
          </div>
          <p className="max-w-prose text-sm leading-relaxed text-ink-500">
            {t("episodeWorkspaceSubtitleV2")}
          </p>
        </div>
        <div className="shrink-0 sm:pt-0.5">
          <StudioProductionsDeleteEpisodeForm
            episodeId={episode.id}
            buttonSize="sm"
          />
        </div>
      </header>

      <div
        role="tablist"
        aria-label={t("episodeDetailSubtabsAria")}
        className="flex flex-wrap items-center gap-1 border-b border-ink-100 bg-paper-50 p-2"
        onKeyDown={onSubtabKeyDown}
      >
        {EPISODE_DETAIL_PANEL_IDS.map((id) => {
          const selected = panel === id;
          const tabId = `${baseId}-ep-sub-${id}`;
          const Icon = TAB_ICONS[id];
          const label = t(TAB_LABEL_KEYS[id]);
          return (
            <Fragment key={id}>
              <button
                ref={(el) => {
                  tabButtonRefs.current[id] = el;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${id}`}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  "inline-flex min-h-[38px] flex-1 cursor-pointer items-center justify-start gap-2 px-3 py-2 text-left text-sm font-medium transition-colors duration-80 ease-(--ease-editorial) sm:min-w-30 sm:flex-none sm:px-4",
                  selected
                    ? "border border-ink-100 bg-paper-100 text-ink-900"
                    : "border border-transparent text-ink-600 hover:border-ink-100 hover:bg-paper-100 hover:text-ink-900",
                )}
                onClick={() => {
                  setPanelAndUrl(id);
                }}
              >
                <Icon
                  className="hidden h-3.5 w-3.5 shrink-0 opacity-75 sm:block"
                  aria-hidden
                />
                <span className="min-w-0">{label}</span>
              </button>
              {TAB_DIVIDER_AFTER.includes(id) ? (
                <div
                  className="hidden h-7 w-px shrink-0 self-center bg-ink-100 sm:block"
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-references`}
        role="tabpanel"
        aria-labelledby={`${baseId}-ep-sub-references`}
        hidden={panel !== "references"}
        className={panel !== "references" ? "hidden" : undefined}
      >
        <section className="px-5 py-6 sm:px-6">
          <EpisodePanelIntro
            phaseKey="episodePhasePlan"
            titleKey="episodePanelHeadReferences"
            bodyKey="episodePanelBodyReferences"
          />
          <ProductionEpisodeReferencePanel
            episodeId={episode.id}
            artifacts={artifacts}
            omitSectionHeader
            className="border-t-0 pt-0"
          />
        </section>
      </div>

      <div
        id={`${baseId}-panel-pipeline`}
        role="tabpanel"
        aria-labelledby={`${baseId}-ep-sub-pipeline`}
        hidden={panel !== "pipeline"}
        className={panel !== "pipeline" ? "hidden" : undefined}
      >
        <section className="px-5 py-6 sm:px-6">
          <EpisodePanelIntro
            phaseKey="episodePhaseProduce"
            titleKey="episodePanelHeadProduce"
            bodyKey="episodePanelBodyProduce"
          />
          <ProductionEpisodeScenesOverview
            scenePlanRows={scenePlanRows}
            artifacts={artifacts}
          />
          {sceneKeyframesSlot}
          <ProductionEpisodePipeline
            episodeId={episode.id}
            pipelinePrefs={episode.pipeline_prefs ?? {}}
            artifacts={artifacts}
            runwayRenderReady={runwayRenderReady}
            elevenlabsKeyConfigured={elevenlabsKeyConfigured}
            openaiKeyConfigured={openaiKeyConfigured}
            packagingLlmReady={packagingLlmReady}
            publishUrl={episode.publish_url}
            episodeTitle={episode.title}
            youtubeChannelTitle={youtubeChannelTitle}
            episodeFormat={episodeFormat}
            distributionChannelLabel={distributionChannelLabel}
            canEditDraft={canEditDraft}
            customDraftTemplates={customDraftTemplates}
            draftLlmAvailability={draftLlmAvailability}
            draftSnapshots={draftSnapshots}
            activeAssemblyJob={activeAssemblyJob ?? null}
            brandGuide={brandGuide}
            className="border-t-0 pt-0"
          />
        </section>
      </div>

      <div
        id={`${baseId}-panel-detail`}
        role="tabpanel"
        aria-labelledby={`${baseId}-ep-sub-detail`}
        hidden={panel !== "detail"}
        className={panel !== "detail" ? "hidden" : undefined}
      >
        <section
          className="px-5 py-6 sm:px-6"
          aria-labelledby={`episode-meta-${episode.id}`}
        >
          <EpisodePanelIntro
            phaseKey="episodePhaseAdmin"
            titleKey="episodePanelHeadEpisode"
            bodyKey="episodePanelBodyEpisode"
          />
          <div className="mt-2" id={`episode-meta-${episode.id}`}>
            <StudioProductionsEpisodeEditForm
              key={`${episode.id}-${episode.updated_at}`}
              episode={episode}
              projects={studioProjects}
              layout="embedded"
            />
          </div>
        </section>
        <div className="border-t border-ink-100 px-5 py-4 sm:px-6">
          {helpSection}
        </div>
      </div>
    </article>
  );
}

function DetailWorkspaceFallback() {
  return (
    <div
      className="mb-6 h-[min(28rem,70vh)] animate-pulse border border-ink-100 bg-paper-100"
      aria-hidden
    />
  );
}

export function ProductionEpisodeDetailWorkspace(
  props: Parameters<typeof ProductionEpisodeDetailWorkspaceInner>[0],
) {
  return (
    <Suspense fallback={<DetailWorkspaceFallback />}>
      <ProductionEpisodeDetailWorkspaceInner {...props} />
    </Suspense>
  );
}
