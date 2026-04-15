import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductionEpisodeAtAGlance } from "@/components/dashboard/production-episode-at-glance";
import { ProductionEpisodeArtifactsClient } from "@/components/dashboard/production-episode-artifacts-client";
import { ProductionEpisodeWorkbench } from "@/components/dashboard/production-episode-workbench";
import {
  StudioProductionsDeleteEpisodeForm,
  StudioProductionsEpisodeEditForm,
} from "@/components/dashboard/studio-productions-forms";
import { createClient } from "@/lib/supabase/server";
import {
  getStudioEpisodeForOrg,
  listStudioArtifactsForEpisode,
} from "@/lib/data/studio-productions";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { getOrgLlmProviderAvailability } from "@/lib/studio-productions/episode-llm";
import { listDraftTemplatesForOrg } from "@/lib/data/studio-draft-templates";
import { listDraftSnapshotsForEpisode } from "@/lib/studio-productions/draft-snapshots";
import type { StudioEpisodeStatus } from "@/lib/studio-productions/constants";
import { distributionDisplayLabel } from "@/lib/studio-productions/distribution";
import { parseWorkbenchTabParam } from "@/lib/studio-productions/workbench-tab";
import { ORG_EDITOR_ROLES } from "@/lib/auth/require-org-editor";
import { ProductionEpisodeDraftPanel } from "@/components/dashboard/production-episode-draft-panel";

type Props = {
  params: Promise<{ episodeId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

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

export default async function ProductionEpisodePage({
  params,
  searchParams,
}: Props) {
  const { episodeId } = await params;
  const sp = await searchParams;
  const tabParam = sp.tab;
  const tabStr = Array.isArray(tabParam) ? tabParam[0] : tabParam;
  const initialWorkbenchTab = parseWorkbenchTabParam(tabStr ?? null);
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

  const artifacts = await listStudioArtifactsForEpisode(
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

  const runwayRenderReady =
    canEditDraft &&
    readStudioIntegrationsServerEnabled() &&
    isStudioIntegrationsEncryptionConfigured() &&
    Boolean(await getOrgProviderApiKey(supabase, orgId, "runway"));

  const t = await getTranslations("Dashboard.productions");
  const statusKey =
    STATUS_I18N[episode.status as StudioEpisodeStatus] ?? "statusDraft";

  const channelLine = episode.distribution_label
    ? distributionDisplayLabel(episode.distribution_label, (key) =>
        t(key as never),
      )
    : null;

  const linkedChannel = episode.studio_distribution_channels;

  return (
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
        initialTabFromUrl={initialWorkbenchTab}
        overviewSlot={
          <ProductionEpisodeAtAGlance
            notes={episode.notes}
            publishUrl={episode.publish_url}
            artifacts={artifacts}
          />
        }
        episodeSlot={
          <>
            <article className="mb-10 overflow-hidden rounded-xl border border-border-subtle bg-layer-01 shadow-sm dark:border-white/10">
              <header className="flex flex-col gap-3 border-b border-border-subtle bg-layer-02/40 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                      {episode.title}
                    </h1>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {t(statusKey)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    {channelLine ? (
                      <p className="text-sm text-text-secondary">{channelLine}</p>
                    ) : null}
                    {linkedChannel ? (
                      <a
                        href={linkedChannel.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border-subtle bg-layer-01/80 px-3 py-1.5 text-sm font-medium text-primary hover:bg-layer-01 dark:bg-[#0f141c]/80"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                        {t("episodeChannelCta", { label: linkedChannel.label })}
                      </a>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-text-tertiary max-w-prose">
                    {t("episodeWorkspaceSubtitle")}
                  </p>
                </div>
                <div className="shrink-0 sm:pt-0.5">
                  <StudioProductionsDeleteEpisodeForm episodeId={episode.id} buttonSize="sm" />
                </div>
              </header>

              <div className="divide-y divide-border-subtle">
                <section
                  className="px-5 py-6 sm:px-6"
                  aria-labelledby={`episode-meta-${episode.id}`}
                >
                  <h2
                    id={`episode-meta-${episode.id}`}
                    className="text-base font-semibold tracking-tight text-text-primary"
                  >
                    {t("formSectionTitle")}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-text-tertiary max-w-prose">
                    {t("episodeMetaDescription")}
                  </p>
                  <div className="mt-5">
                    <StudioProductionsEpisodeEditForm
                      key={`${episode.id}-${episode.updated_at}`}
                      episode={episode}
                      layout="embedded"
                    />
                  </div>
                </section>

                <section className="px-5 py-6 sm:px-6">
                  <ProductionEpisodeDraftPanel
                    episodeId={episode.id}
                    artifacts={artifacts}
                    canEdit={canEditDraft}
                    customDraftTemplates={customDraftTemplates}
                    draftLlmAvailability={draftLlmAvailability}
                    draftSnapshots={draftSnapshots}
                    runwayRenderReady={runwayRenderReady}
                    embedded
                  />
                </section>
              </div>
            </article>

            <section
              className="mb-8 rounded-xl border border-dashed border-border-subtle bg-layer-02/30 px-4 py-3"
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
          </>
        }
        artifactsSlot={
          <ProductionEpisodeArtifactsClient
            episodeId={episode.id}
            artifacts={artifacts}
          />
        }
      />
    </div>
  );
}
