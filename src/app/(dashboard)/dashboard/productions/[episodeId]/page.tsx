import type { Metadata } from "next";
import Link from "next/link";
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
import type { StudioEpisodeStatus } from "@/lib/studio-productions/constants";
import { distributionDisplayLabel } from "@/lib/studio-productions/distribution";
import { parseWorkbenchTabParam } from "@/lib/studio-productions/workbench-tab";

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
    .select("organization_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const orgId = profile?.organization_id;
  if (!orgId) notFound();

  const episode = await getStudioEpisodeForOrg(supabase, episodeId, orgId);
  if (!episode) notFound();

  const artifacts = await listStudioArtifactsForEpisode(
    supabase,
    episodeId,
    orgId,
  );

  const t = await getTranslations("Dashboard.productions");
  const statusKey =
    STATUS_I18N[episode.status as StudioEpisodeStatus] ?? "statusDraft";

  const channelLine = episode.distribution_label
    ? distributionDisplayLabel(episode.distribution_label, (key) =>
        t(key as never),
      )
    : null;

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

      <header className="relative mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-layer-01 via-[#f0f4ff]/50 to-layer-02 p-6 shadow-sm dark:border-white/10 dark:from-[#0b1018] dark:via-[#0d1522] dark:to-[#080c12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/[0.12]" aria-hidden />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                {episode.title}
              </h1>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {t(statusKey)}
              </span>
            </div>
            {channelLine ? (
              <p className="text-sm text-text-secondary">{channelLine}</p>
            ) : null}
          </div>
        </div>
      </header>

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
            </section>

            <section className="mb-10">
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                {t("formSectionTitle")}
              </h2>
              <StudioProductionsEpisodeEditForm episode={episode} />
            </section>

            <div className="mb-10 rounded-xl border border-border-subtle bg-layer-02/20 p-4">
              <StudioProductionsDeleteEpisodeForm episodeId={episode.id} />
            </div>
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
