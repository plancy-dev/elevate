import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ProductionsHubWithDialogs } from "@/components/dashboard/productions-hub-with-dialogs";
import { ProductionEpisodeAtAGlance } from "@/components/dashboard/production-episode-at-glance";
import { ProductionEpisodeArtifactsClient } from "@/components/dashboard/production-episode-artifacts-client";
import { ProductionEpisodeDetailWorkspace } from "@/components/dashboard/production-episode-detail-workspace";
import { ProductionEpisodeWorkbench } from "@/components/dashboard/production-episode-workbench";
import { PublishScheduler } from "@/components/dashboard/publish-scheduler";
import { SceneImageGallery } from "@/components/dashboard/scene-image-gallery";
import { createClient } from "@/lib/supabase/server";
import { listStudioProjectsForOrg } from "@/lib/data/studio-projects";
import {
  getStudioEpisodeForOrg,
  listStudioArtifactsForEpisode,
} from "@/lib/data/studio-productions";
import { listScheduledPostsForEpisode } from "@/lib/data/studio-scheduled-posts";
import { loadSceneKeyframeArtifacts } from "@/lib/studio-productions/scene-keyframe-artifacts";
import {
  parseSocialCaptions,
  type SocialCaptions,
} from "@/lib/studio-productions/social-captions";
import { resolveBufferApiKey } from "@/lib/studio-integrations/buffer-key-source";
import { listBufferChannels, type BufferChannel } from "@/lib/studio-integrations/providers/buffer";
import {
  STUDIO_IMAGE_PROVIDER_IDS,
  type StudioImageProviderId,
} from "@/lib/studio-integrations/types";
import { getLatestActiveAssemblyJobForEpisode } from "@/lib/data/studio-video-assembly-jobs";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { getOrgLlmProviderAvailability } from "@/lib/studio-productions/episode-llm";
import { distributionDisplayLabel } from "@/lib/studio-productions/distribution";
import { resolveEpisodeFormat } from "@/lib/studio-productions/episode-format";
import { listDraftTemplatesForOrg } from "@/lib/data/studio-draft-templates";
import { listDraftSnapshotsForEpisode } from "@/lib/studio-productions/draft-snapshots";
import { ORG_EDITOR_ROLES } from "@/lib/auth/require-org-editor";
import { loadProductionsStudioDialogPayload } from "@/lib/studio-productions/load-productions-studio-dialog-payload";
import { scenePlanRowsFromPipelinePrefs } from "@/lib/studio-productions/episode-scene-plan-dto";

type Props = {
  params: Promise<{ episodeId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { episodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Productions" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = profile?.organization_id;
  if (!orgId) {
    const t = await getTranslations("Dashboard.productions");
    return { title: t("detailMetaTitle") };
  }

  const episode = await getStudioEpisodeForOrg(supabase, episodeId, orgId);
  const t = await getTranslations("Dashboard.productions");
  if (!episode) return { title: t("detailMetaTitle") };
  return { title: `${episode.title} · ${t("detailMetaTitle")}` };
}

export default async function ProductionEpisodePage({ params }: Props) {
  const { episodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const orgId = profile?.organization_id;
  if (!orgId) notFound();

  const role = profile?.role ?? "viewer";
  const canEditDraft = (ORG_EDITOR_ROLES as readonly string[]).includes(role);

  const episode = await getStudioEpisodeForOrg(supabase, episodeId, orgId);
  if (!episode) notFound();

  const studioProjects = await listStudioProjectsForOrg(supabase, orgId);

  const artifacts = await listStudioArtifactsForEpisode(
    supabase,
    episodeId,
    orgId,
  );

  const activeAssemblyJob = await getLatestActiveAssemblyJobForEpisode(
    supabase,
    episodeId,
    orgId,
  );

  const draftLlmAvailability = await getOrgLlmProviderAvailability(
    supabase,
    orgId,
  );

  const draftSnapshots = canEditDraft
    ? await listDraftSnapshotsForEpisode(supabase, episodeId, orgId, 30)
    : [];

  const customDraftTemplates = canEditDraft
    ? await listDraftTemplatesForOrg(supabase, orgId)
    : [];

  const integrationsEnvReady =
    readStudioIntegrationsServerEnabled() &&
    isStudioIntegrationsEncryptionConfigured();

  const runwayRenderReady =
    canEditDraft &&
    integrationsEnvReady &&
    Boolean(await getOrgProviderApiKey(supabase, orgId, "runway"));

  const elevenlabsKeyConfigured =
    canEditDraft &&
    integrationsEnvReady &&
    Boolean(await getOrgProviderApiKey(supabase, orgId, "elevenlabs"));

  const packagingLlmReady = Boolean(
    draftLlmAvailability &&
      (draftLlmAvailability.openai || draftLlmAvailability.anthropic),
  );

  const openaiKeyConfigured =
    canEditDraft &&
    integrationsEnvReady &&
    Boolean(draftLlmAvailability?.openai);

  const t = await getTranslations("Dashboard.productions");

  const { data: youtubeChannelRow } = await supabase
    .from("studio_youtube_channel_tokens")
    .select("channel_title")
    .eq("organization_id", orgId)
    .limit(1)
    .maybeSingle();

  const youtubeChannelTitle = youtubeChannelRow?.channel_title?.trim() || null;
  const episodeFormat = resolveEpisodeFormat(episode);
  const linkedChannelLabel = episode.studio_distribution_channels?.label?.trim();
  const presetDistributionLabel = episode.distribution_label?.trim()
    ? distributionDisplayLabel(episode.distribution_label, (key) => t(key as never)).trim()
    : "";
  const distributionChannelLabel = linkedChannelLabel || presetDistributionLabel || null;

  const studioDialogPayload = await loadProductionsStudioDialogPayload(
    supabase,
    orgId,
  );

  const scenePlanRows = scenePlanRowsFromPipelinePrefs(
    episode.pipeline_prefs ?? null,
  );

  // Scene keyframes (ADR-009): load artifacts + parsed scene plan + available
  // image provider keys so the gallery only shows providers the org can use.
  // Scene plan lives in `episode.pipeline_prefs.sceneRender.scenesJson`, not
  // as a `settings/scene_plan` artifact — reuse the already-parsed `scenePlanRows`.
  const sceneKeyframesByIndex = await loadSceneKeyframeArtifacts(
    supabase,
    orgId,
    episodeId,
  );
  const sceneGalleryRows = (scenePlanRows ?? []).map((row) => {
    const slot = sceneKeyframesByIndex.get(row.index);
    return {
      ...row,
      first: slot?.first ?? null,
      last: slot?.last ?? null,
      candidates: slot?.candidates ?? [],
    };
  });

  const availableImageProviders: StudioImageProviderId[] = [];
  if (integrationsEnvReady) {
    for (const id of STUDIO_IMAGE_PROVIDER_IDS) {
      if (await getOrgProviderApiKey(supabase, orgId, id)) {
        availableImageProviders.push(id);
      }
    }
  }

  // Publish scheduler inputs (Phase 3). Falls back silently when Buffer is
  // not configured or the user cannot edit — the UI renders a dormant hint.
  const assembledVideoArtifact = artifacts
    .filter((a) => a.artifact_role === "assembled_video")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  const assembledVideoUrl = assembledVideoArtifact?.external_url ?? null;

  const captionsArtifact = artifacts
    .filter((a) => a.artifact_role === "social_captions")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  const parsedCaptions: SocialCaptions | null = captionsArtifact?.content_text
    ? parseSocialCaptions(captionsArtifact.content_text)
    : null;

  let bufferChannels: BufferChannel[] = [];
  let bufferReady = false;
  if (integrationsEnvReady) {
    const bufferKey = await resolveBufferApiKey(supabase, orgId);
    if (bufferKey) {
      bufferReady = true;
      const listResult = await listBufferChannels(bufferKey);
      if (listResult.ok) bufferChannels = listResult.channels;
    }
  }

  const scheduledPosts = await listScheduledPostsForEpisode(
    supabase,
    orgId,
    episodeId,
  );

  return (
    <Suspense fallback={null}>
      <ProductionsHubWithDialogs payload={studioDialogPayload}>
        <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
          <div className="mb-6">
            <Link
              href="/dashboard/productions"
              className="text-sm font-medium text-vermilion-600 hover:underline"
            >
              {t("backToList")}
            </Link>
          </div>

          <ProductionEpisodeWorkbench
            episodeId={episode.id}
            overviewSlot={
              <ProductionEpisodeAtAGlance
                notes={episode.notes}
                publishUrl={episode.publish_url}
                artifacts={artifacts}
              />
            }
            episodeSlot={
              <>
                <ProductionEpisodeDetailWorkspace
                  episode={episode}
                  studioProjects={studioProjects.map((p) => ({
                    id: p.id,
                    name: p.name,
                  }))}
                  artifacts={artifacts}
                  canEditDraft={canEditDraft}
                  customDraftTemplates={customDraftTemplates}
                  draftLlmAvailability={draftLlmAvailability}
                  draftSnapshots={draftSnapshots}
                  runwayRenderReady={runwayRenderReady}
                  elevenlabsKeyConfigured={elevenlabsKeyConfigured}
                  openaiKeyConfigured={openaiKeyConfigured}
                  packagingLlmReady={packagingLlmReady}
                  youtubeChannelTitle={youtubeChannelTitle}
                  episodeFormat={episodeFormat}
                  distributionChannelLabel={distributionChannelLabel}
                  activeAssemblyJob={activeAssemblyJob}
                  brandGuide={episode.studio_projects?.brand_guide?.trim() ?? null}
                  scenePlanRows={scenePlanRows}
                  sceneKeyframesSlot={
                    sceneGalleryRows.length > 0 ? (
                      <section className="border border-ink-100 bg-paper-100 p-4">
                        <header className="mb-3 space-y-1">
                          <h3 className="text-sm font-semibold text-ink-900">
                            {t("sceneKeyframeGalleryTitle")}
                          </h3>
                          <p className="font-mono text-[11px] leading-snug text-ink-500">
                            {t("sceneKeyframeGallerySubtitle")}
                          </p>
                        </header>
                        <SceneImageGallery
                          episodeId={episode.id}
                          scenes={sceneGalleryRows}
                          availableProviders={availableImageProviders}
                          canEdit={canEditDraft}
                        />
                      </section>
                    ) : null
                  }
                  helpSection={
                    <section
                      className="border border-dashed border-ink-100 bg-paper-100 px-4 py-3"
                      aria-labelledby="prod-help-title"
                    >
                      <h2
                        id="prod-help-title"
                        className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500"
                      >
                        {t("helpTitle")}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                        {t("helpBody")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">
                        {t("helpRunbook")}
                      </p>
                    </section>
                  }
                />
                <section className="mb-6 border border-ink-100 bg-paper-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {t("editorCtaTitle")}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {t("editorCtaSubtitle")}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/productions/${episode.id}/editor`}
                      className="inline-flex items-center gap-1.5 border border-vermilion-600 bg-paper-0 px-3 py-1.5 text-xs font-semibold text-vermilion-600 hover:bg-vermilion-100"
                    >
                      {t("editorCtaButton")}
                    </Link>
                  </div>
                </section>
                <PublishScheduler
                  episodeId={episode.id}
                  videoUrl={assembledVideoUrl}
                  captions={parsedCaptions}
                  channels={bufferChannels}
                  scheduled={scheduledPosts}
                  bufferReady={bufferReady}
                  canEdit={canEditDraft}
                />
                <ProductionEpisodeArtifactsClient
                  episodeId={episode.id}
                  artifacts={artifacts}
                />
              </>
            }
          />
        </div>
      </ProductionsHubWithDialogs>
    </Suspense>
  );
}
