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
import { createClient } from "@/lib/supabase/server";
import { listStudioProjectsForOrg } from "@/lib/data/studio-projects";
import {
  getStudioEpisodeForOrg,
  listStudioArtifactsForEpisode,
} from "@/lib/data/studio-productions";
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

  return (
    <Suspense fallback={null}>
      <ProductionsHubWithDialogs payload={studioDialogPayload}>
        <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
          <div className="mb-6">
            <Link
              href="/dashboard/productions"
              className="text-sm font-medium text-interactive hover:underline"
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
                helpSection={
                  <section
                    className="rounded-xl border border-dashed border-border-subtle bg-layer-02/30 px-4 py-3"
                    aria-labelledby="prod-help-title"
                  >
                    <h2
                      id="prod-help-title"
                      className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary"
                    >
                      {t("helpTitle")}
                    </h2>
                    <p className="mt-1.5 text-sm text-text-tertiary leading-relaxed">
                      {t("helpBody")}
                    </p>
                    <p className="mt-2 text-sm text-text-tertiary leading-relaxed">
                      {t("helpRunbook")}
                    </p>
                  </section>
                }
              />
            }
            artifactsSlot={
              <ProductionEpisodeArtifactsClient
                episodeId={episode.id}
                artifacts={artifacts}
              />
            }
          />
        </div>
      </ProductionsHubWithDialogs>
    </Suspense>
  );
}
