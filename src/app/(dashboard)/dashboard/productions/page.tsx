import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listStudioEpisodesForOrg } from "@/lib/data/studio-productions";
import { getAppLocale } from "@/lib/i18n/app-locale";
import type { StudioEpisodeStatus } from "@/lib/studio-productions/constants";
import { distributionDisplayLabel } from "@/lib/studio-productions/distribution";
import { ProductionsDemoSeedPanel } from "@/components/dashboard/productions-demo-seed-panel";

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

export default async function ProductionsListPage() {
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
      <div className="p-6 lg:p-8 max-w-4xl">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {t("metaTitle")}
        </h1>
        <p className="mt-4 text-sm text-text-secondary">{t("listEmpty")}</p>
      </div>
    );
  }

  const episodes = await listStudioEpisodesForOrg(supabase, orgId);
  const showDemoSeed = process.env.ENABLE_STUDIO_DEMO_SEED === "true";

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {t("metaTitle")}
          </h1>
          <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
            {t("listSubtitle")}
          </p>
        </div>
        <ButtonLink href="/dashboard/productions/new" variant="primary" size="md">
          {t("listCtaNew")}
        </ButtonLink>
      </div>

      {episodes.length === 0 ? (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-text-secondary">{t("listEmpty")}</p>
          {showDemoSeed ? <ProductionsDemoSeedPanel /> : null}
          <ButtonLink href="/dashboard/productions/new" variant="secondary">
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
              return (
                <li key={ep.id}>
                  <Link
                    href={`/dashboard/productions/${ep.id}`}
                    className="group flex flex-col gap-2 px-5 py-4 transition-colors duration-150 hover:bg-layer-02 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <Badge variant="blue" className="shrink-0 tabular-nums">
                          {t(statusKey)}
                        </Badge>
                        <span className="min-w-0 text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
                          {ep.title}
                        </span>
                      </div>
                      {ep.distribution_label ? (
                        <p className="mt-1.5 text-xs text-text-tertiary">
                          {distributionDisplayLabel(ep.distribution_label, (key) =>
                            t(key as never),
                          )}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-xs text-text-tertiary sm:text-right">
                      <span className="text-text-secondary">{t("colUpdated")}: </span>
                      {updated}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
