import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listStudioEpisodesForOrg } from "@/lib/data/studio-productions";
import { listStudioDistributionChannelsForOrg } from "@/lib/studio-productions/shorts-catalog";
import { ProductionsChannelFilter } from "@/components/dashboard/productions-channel-filter";
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
  searchParams: Promise<{ channel?: string | string[] }>;
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
      <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {t("metaTitle")}
        </h1>
        <p className="mt-4 text-sm text-text-secondary">{t("listEmpty")}</p>
      </div>
    );
  }

  const channels = await listStudioDistributionChannelsForOrg(supabase, orgId);
  const validChannelId =
    channelParamRaw && channels.some((c) => c.id === channelParamRaw)
      ? channelParamRaw
      : null;

  const episodes = await listStudioEpisodesForOrg(supabase, orgId, {
    distributionChannelId: validChannelId ?? undefined,
  });
  const showDemoSeed = process.env.ENABLE_STUDIO_DEMO_SEED === "true";

  const newEpisodeHref = validChannelId
    ? `/dashboard/productions/new?channel=${encodeURIComponent(validChannelId)}`
    : "/dashboard/productions/new";

  return (
    <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {t("metaTitle")}
          </h1>
          <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
            {t("listSubtitle")}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end shrink-0">
          {channels.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <ProductionsChannelFilter
                channels={channels.map((c) => ({
                  id: c.id,
                  label: c.label,
                  platform: c.platform,
                }))}
                currentChannelId={validChannelId}
              />
              {validChannelId ? (
                <ButtonLink href={newEpisodeHref} variant="secondary" size="md" className="w-full sm:w-auto">
                  {t("listNewWithChannel")}
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 justify-end">
            <ButtonLink href="/dashboard/productions/channels" variant="secondary" size="md">
              {t("channelsNav")}
            </ButtonLink>
            <ButtonLink href="/dashboard/productions/integrations" variant="secondary" size="md">
              {t("integrationsNav")}
            </ButtonLink>
            <ButtonLink href={newEpisodeHref} variant="primary" size="md">
              {t("listCtaNew")}
            </ButtonLink>
          </div>
        </div>
      </div>

      {episodes.length === 0 ? (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-text-secondary">{t("listEmpty")}</p>
          {showDemoSeed ? <ProductionsDemoSeedPanel /> : null}
          <ButtonLink href={newEpisodeHref} variant="secondary">
            {t("listCtaNew")}
          </ButtonLink>
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
                  className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-layer-02 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
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
                      {ep.distribution_label ? (
                        <span>
                          {distributionDisplayLabel(ep.distribution_label, (key) =>
                            t(key as never),
                          )}
                        </span>
                      ) : null}
                    </div>
                  </Link>
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
    </div>
  );
}
