"use client";

import { ProductionEpisodePipeline } from "@/components/dashboard/production-episode-pipeline";
import { ProductionEpisodeReferencePanel } from "@/components/dashboard/production-episode-reference-panel";
import { EpisodeDraftWorkbench } from "@/components/dashboard/episode-draft-workbench";
import type { StudioEpisodeDraftTemplateRow } from "@/lib/data/studio-draft-templates";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import type { StudioEpisodeDraftSnapshotRow } from "@/lib/studio-productions/draft-snapshots";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function ProductionEpisodeDraftPanelEditable({
  episodeId,
  artifacts,
  canEditDraft,
  customDraftTemplates,
  draftLlmAvailability,
  draftSnapshots,
  runwayRenderReady = false,
  elevenlabsKeyConfigured = false,
  openaiKeyConfigured,
  packagingLlmReady,
  publishUrl,
  className,
  embedded,
  showReferencePanel = true,
  showPipeline = true,
}: {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  canEditDraft: boolean;
  customDraftTemplates: StudioEpisodeDraftTemplateRow[];
  draftLlmAvailability?: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots: StudioEpisodeDraftSnapshotRow[];
  runwayRenderReady?: boolean;
  elevenlabsKeyConfigured?: boolean;
  openaiKeyConfigured?: boolean;
  packagingLlmReady?: boolean;
  publishUrl?: string | null;
  className?: string;
  embedded?: boolean;
  showReferencePanel?: boolean;
  showPipeline?: boolean;
}) {
  return (
    <EpisodeDraftWorkbench
      variant="panel"
      episodeId={episodeId}
      artifacts={artifacts}
      customDraftTemplates={customDraftTemplates}
      draftLlmAvailability={draftLlmAvailability}
      draftSnapshots={draftSnapshots}
      className={className}
      embedded={embedded}
      scriptTextareaRows={8}
      afterRefineSlot={
        <>
          {showReferencePanel ? (
            <ProductionEpisodeReferencePanel episodeId={episodeId} artifacts={artifacts} />
          ) : null}
          {showPipeline ? (
            <ProductionEpisodePipeline
              episodeId={episodeId}
              artifacts={artifacts}
              runwayRenderReady={runwayRenderReady}
              elevenlabsKeyConfigured={elevenlabsKeyConfigured}
              openaiKeyConfigured={openaiKeyConfigured}
              packagingLlmReady={packagingLlmReady}
              publishUrl={publishUrl}
              canEditDraft={canEditDraft}
              customDraftTemplates={customDraftTemplates}
              draftLlmAvailability={draftLlmAvailability}
              draftSnapshots={draftSnapshots}
            />
          ) : null}
        </>
      }
    />
  );
}

export function ProductionEpisodeDraftPanel({
  episodeId,
  artifacts,
  canEdit,
  customDraftTemplates = [],
  draftLlmAvailability,
  draftSnapshots = [],
  runwayRenderReady = false,
  elevenlabsKeyConfigured = false,
  openaiKeyConfigured,
  packagingLlmReady,
  publishUrl,
  className,
  embedded = false,
  showReferencePanel = true,
  showPipeline = true,
}: {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  canEdit: boolean;
  customDraftTemplates?: StudioEpisodeDraftTemplateRow[];
  draftLlmAvailability?: { openai: boolean; anthropic: boolean } | null;
  draftSnapshots?: StudioEpisodeDraftSnapshotRow[];
  runwayRenderReady?: boolean;
  elevenlabsKeyConfigured?: boolean;
  openaiKeyConfigured?: boolean;
  packagingLlmReady?: boolean;
  publishUrl?: string | null;
  className?: string;
  embedded?: boolean;
  showReferencePanel?: boolean;
  showPipeline?: boolean;
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
      canEditDraft={canEdit}
      customDraftTemplates={customDraftTemplates}
      draftLlmAvailability={draftLlmAvailability}
      draftSnapshots={draftSnapshots}
      runwayRenderReady={runwayRenderReady}
      elevenlabsKeyConfigured={elevenlabsKeyConfigured}
      openaiKeyConfigured={openaiKeyConfigured}
      packagingLlmReady={packagingLlmReady}
      publishUrl={publishUrl}
      className={className}
      embedded={embedded}
      showReferencePanel={showReferencePanel}
      showPipeline={showPipeline}
    />
  );
}
