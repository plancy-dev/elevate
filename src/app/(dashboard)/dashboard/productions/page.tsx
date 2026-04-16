import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronDown, Clapperboard, ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  countStudioEpisodesByProjectForOrg,
  countStudioEpisodesForOrg,
  listStudioEpisodesForOrg,
} from "@/lib/data/studio-productions";
import { listStudioProjectsForOrg } from "@/lib/data/studio-projects";
import { listStudioDistributionChannelsForOrg } from "@/lib/studio-productions/shorts-catalog";
import { getStudioIntegrationsPageData } from "@/actions/studio-org-integrations";
import {
  isStudioIntegrationsEncryptionConfigured,
  readStudioIntegrationsServerEnabled,
  readStudioIntegrationsUiFlag,
} from "@/lib/studio-integrations";
import { ProductionsChannelFilter } from "@/components/dashboard/productions-channel-filter";
import {
  ProductionsProjectSwitcher,
  PROJECT_QUERY_UNASSIGNED,
} from "@/components/dashboard/productions-project-switcher";
import { ProductionsQueueScopeBanner } from "@/components/dashboard/productions-queue-scope-banner";
import { ProductionsHubWithDialogs } from "@/components/dashboard/productions-hub-with-dialogs";
import {
  ProductionsQueueHeadingRow,
  ProductionsStudioToolbarActions,
} from "@/components/dashboard/productions-studio-dialog-root";
import { ProductionsEmptyQueue } from "@/components/dashboard/productions-empty-queue";
import { getAppLocale } from "@/lib/i18n/app-locale";
import type { StudioEpisodeStatus } from "@/lib/studio-productions/constants";
import { distributionDisplayLabel } from "@/lib/studio-productions/distribution";
import { ProductionsDemoSeedPanel } from "@/components/dashboard/productions-demo-seed-panel";
import { StudioProductionsDeleteEpisodeForm } from "@/components/dashboard/studio-productions-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.productions");
  return { title: t("metaTitle") };
}

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

type PageProps = {
  searchParams: Promise<{ channel?: string | string[]; project?: string | string[] }>;
};

export default async function ProductionsListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const channelParam = Array.isArray(sp.channel) ? sp.channel[0] : sp.channel;
  const channelParamRaw = channelParam?.trim() || null;

  const t = await getTranslations("Dashboard.productions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const orgId = profile?.organization_id ?? null;
  const locale = await getAppLocale();

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {t("metaTitle")}
        </h1>
        <p className="mt-4 text-sm text-text-secondary">{t("listEmpty")}</p>
      </div>
    );
  }

  const projectParam = Array.isArray(sp.project) ? sp.project[0] : sp.project;
  const projectParamRaw = projectParam?.trim() || null;

  const [channels, projects, integrationsPage] = await Promise.all([
    listStudioDistributionChannelsForOrg(supabase, orgId),
    listStudioProjectsForOrg(supabase, orgId),
    getStudioIntegrationsPageData(),
  ]);

  const integrationsUiPreview = readStudioIntegrationsUiFlag();
  const integrationsServerCalls = readStudioIntegrationsServerEnabled();
  const integrationsEncryption = isStudioIntegrationsEncryptionConfigured();

  const validChannelId =
    channelParamRaw && channels.some((c) => c.id === channelParamRaw)
      ? channelParamRaw
      : null;

  const unassignedFilter = projectParamRaw === PROJECT_QUERY_UNASSIGNED;
  const validProjectId =
    projectParamRaw &&
    !unassignedFilter &&
    projects.some((p) => p.id === projectParamRaw)
      ? projectParamRaw
      : null;

  const channelCountOpts = { distributionChannelId: validChannelId ?? undefined };

  const listOpts = {
    distributionChannelId: validChannelId ?? undefined,
    ...(unassignedFilter
      ? { unassignedOnly: true as const }
      : validProjectId
        ? { projectId: validProjectId }
        : {}),
  };

  const [episodes, totalCountAll, countsByProject] = await Promise.all([
    listStudioEpisodesForOrg(supabase, orgId, listOpts),
    countStudioEpisodesForOrg(supabase, orgId, channelCountOpts),
    countStudioEpisodesByProjectForOrg(supabase, orgId, channelCountOpts),
  ]);

  const assignedEpisodeTotal = Object.values(countsByProject).reduce((a, b) => a + b, 0);
  const unassignedCount = Math.max(0, totalCountAll - assignedEpisodeTotal);

  const selectedScope = unassignedFilter
    ? PROJECT_QUERY_UNASSIGNED
    : validProjectId ?? "";

  const scopedProjectName =
    validProjectId && !unassignedFilter
      ? (projects.find((p) => p.id === validProjectId)?.name ?? "")
      : "";

  const scopedProjectRow =
    validProjectId && !unassignedFilter
      ? (projects.find((p) => p.id === validProjectId) ?? null)
      : null;

  const showDemoSeed = process.env.ENABLE_STUDIO_DEMO_SEED === "true";

  const newEpisodeHref = validChannelId
    ? `/dashboard/productions/new?channel=${encodeURIComponent(validChannelId)}`
    : "/dashboard/productions/new";

  const studioDialogPayload = {
    projects,
    episodeCountsByProjectId: countsByProject,
    locale,
    channels,
    integrations: {
      organizationId: integrationsPage.organizationId,
      canEdit: integrationsPage.canEdit,
      connections: integrationsPage.connections,
      encryptionConfigured: integrationsEncryption,
      serverCallsEnabled: integrationsServerCalls,
      uiPreview: integrationsUiPreview,
    },
  };

  return (
    <ProductionsHubWithDialogs payload={studioDialogPayload}>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border-subtle px-5 py-5 sm:px-6 sm:py-6">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            {t("metaTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {t("hubSubtitle")}
          </p>
          <details className="group mt-4 max-w-2xl text-xs">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-text-secondary outline-none transition-colors hover:text-text-primary [&::-webkit-details-marker]:hidden">
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-150 group-open:rotate-180"
                aria-hidden
              />
              {t("hubHelpTitle")}
            </summary>
            <p className="mt-2 max-w-prose leading-relaxed text-text-tertiary">{t("hubHelpBody")}</p>
          </details>
        </div>

        <div className="border-b border-border-subtle bg-layer-02/30 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:max-w-2xl">
              <ProductionsProjectSwitcher
                projects={projects.map((p) => ({
                  id: p.id,
                  name: p.name,
                }))}
                countsByProjectId={countsByProject}
                totalCountAll={totalCountAll}
                unassignedCount={unassignedCount}
                selectedScope={selectedScope}
                currentChannelId={validChannelId}
                controlLabel={t("hubQueueScopeLabel")}
              />
              {channels.length > 0 ? (
                <ProductionsChannelFilter
                  channels={channels.map((c) => ({
                    id: c.id,
                    label: c.label,
                    platform: c.platform,
                  }))}
                  currentChannelId={validChannelId}
                  preserveProjectParam={selectedScope}
                  controlLabel={t("hubControlChannelLabel")}
                />
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {channels.length > 0 && validChannelId ? (
                <ButtonLink href={newEpisodeHref} variant="secondary" size="md" className="w-full sm:w-auto">
                  {t("listNewWithChannel")}
                </ButtonLink>
              ) : null}
              <ButtonLink href={newEpisodeHref} variant="primary" size="md" className="w-full sm:w-auto">
                {t("listCtaNew")}
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-layer-02/20 px-5 py-3 sm:px-6">
          <ProductionsStudioToolbarActions />
        </div>
      </Card>

      {unassignedFilter ? (
        <div className="mt-6">
          <ProductionsQueueScopeBanner mode="unassigned" />
        </div>
      ) : null}
      {validProjectId && scopedProjectName ? (
        <div className="mt-6">
          <ProductionsQueueScopeBanner mode="project" projectName={scopedProjectName} />
        </div>
      ) : null}

      <section className="mt-8 space-y-4" aria-labelledby="productions-queue-heading">
        <ProductionsQueueHeadingRow
          title={t("hubEpisodeQueueTitle")}
          episodeCount={episodes.length}
          scopedProject={scopedProjectRow}
        />

        {episodes.length === 0 ? (
          <div className="space-y-6">
            <ProductionsEmptyQueue
              title={t("hubEmptyStateTitle")}
              body={t("hubEmptyStateBody")}
              ctaHref={newEpisodeHref}
              ctaLabel={t("listCtaNew")}
            />
            {showDemoSeed ? <ProductionsDemoSeedPanel /> : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-layer-01 shadow-card">
            <ul className="divide-y divide-border-subtle">
              {episodes.map((ep) => {
                const statusKey =
                  STATUS_I18N[ep.status as StudioEpisodeStatus] ?? "statusDraft";
                const updated = new Date(ep.updated_at).toLocaleString(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const channelUrl = ep.studio_distribution_channels?.channel_url;
                return (
                  <li
                    key={ep.id}
                    className="flex flex-col gap-3 px-4 py-4 transition-colors duration-150 hover:bg-layer-02 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5"
                  >
                    <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                      <div
                        className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border-subtle/80 bg-layer-02 text-text-tertiary"
                        aria-hidden
                      >
                        <Clapperboard className="h-5 w-5 opacity-80" />
                      </div>
                      <Link
                        href={`/dashboard/productions/${ep.id}`}
                        className="group min-w-0 flex-1 outline-none"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <Badge variant="blue" className="shrink-0 tabular-nums">
                            {t(statusKey)}
                          </Badge>
                          <span className="min-w-0 text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
                            {ep.title}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-tertiary">
                          {ep.studio_projects?.name ? (
                            <span className="rounded-md border border-border-subtle/80 bg-layer-02 px-1.5 py-0.5 font-medium text-text-secondary">
                              {ep.studio_projects.name}
                            </span>
                          ) : (
                            <span className="text-text-tertiary">{t("episodeRowProjectUnassigned")}</span>
                          )}
                          {ep.distribution_label ? (
                            <span>
                              {distributionDisplayLabel(ep.distribution_label, (key) =>
                                t(key as never),
                              )}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </div>
                    <div className="flex w-full shrink-0 flex-col items-stretch gap-2 text-xs text-text-tertiary sm:w-auto sm:items-end sm:text-right">
                      {channelUrl ? (
                        <a
                          href={channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline sm:justify-end"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden />
                          {t("listChannelOpen")}
                        </a>
                      ) : null}
                      <div>
                        <span className="text-text-secondary">{t("colUpdated")}: </span>
                        {updated}
                      </div>
                      <StudioProductionsDeleteEpisodeForm
                        episodeId={ep.id}
                        buttonSize="sm"
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
      </div>
    </ProductionsHubWithDialogs>
  );
}
