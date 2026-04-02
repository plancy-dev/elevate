import {
  TrendingUp,
  TrendingDown,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
  Package,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { ButtonLink } from "@/components/ui/button";
import { getLibraryPageData } from "@/lib/data/library";
import { listOrgMembers } from "@/lib/data/team";
import { canAccessPlatformAdmin } from "@/lib/auth/platform-admin";
import { createClient } from "@/lib/supabase/server";

const recentActivity: { text: string; time: string }[] = [];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.overview");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-lg rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <ActionErrorMessage
            code={ensured.error}
            className="text-sm text-danger"
          />
        </div>
      </div>
    );
  }

  const orgId = ensured.organizationId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [library, members, profileRow] = await Promise.all([
    getLibraryPageData(supabase, orgId),
    listOrgMembers(orgId),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  const showPlatformAdmin = canAccessPlatformAdmin(
    user.email,
    profileRow.data?.role,
  );
  const t = await getTranslations("Dashboard.overview");

  const entitledCount = library.entitledIds.size;
  const catalogCount = library.products.length;

  const entitledLabel =
    entitledCount === 1
      ? t("entitledOne", { count: entitledCount })
      : t("entitledOther", { count: entitledCount });

  const kpis = [
    {
      label: t("kpiPromptStudio"),
      value: t("kpiReady"),
      change: "—",
      trend: "up" as const,
      icon: Sparkles,
      period: t("kpiImprovePrompts"),
    },
    {
      label: t("kpiLibraryEntitlements"),
      value: String(entitledCount),
      change: "—",
      trend: "up" as const,
      icon: BookOpen,
      period: t("kpiTitlesYouCanUse"),
    },
    {
      label: t("kpiCatalogSkus"),
      value: String(catalogCount),
      change: "—",
      trend: "up" as const,
      icon: Package,
      period: t("kpiActiveProducts"),
    },
    {
      label: t("kpiTeamMembers"),
      value: String(members.length),
      change: "—",
      trend: "up" as const,
      icon: Users,
      period: t("kpiInYourOrg"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <div>
          <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary hidden sm:inline">
            {t("liveData")}
          </span>
          <ButtonLink href="/dashboard/library" variant="tertiary" size="sm">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {t("openLibrary")}
          </ButtonLink>
          <ButtonLink href="/dashboard/studio" variant="primary" size="sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("openPromptStudio")}
          </ButtonLink>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link
            href="/dashboard/studio"
            className="group border border-border-subtle bg-layer-01 p-6 hover:bg-layer-02 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Sparkles className="h-5 w-5" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {t("promptStudioBadge")}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {t("promptStudioHeadline")}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {t("promptStudioDesc")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-tertiary group-hover:text-primary shrink-0 transition-colors" aria-hidden />
            </div>
          </Link>
          <Link
            href="/dashboard/library"
            className="group border border-border-subtle bg-layer-01 p-6 hover:bg-layer-02 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <BookOpen className="h-5 w-5" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {t("libraryBadge")}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {entitledLabel}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {t("libraryDesc")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-tertiary group-hover:text-primary shrink-0 transition-colors" aria-hidden />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-border-subtle border border-border-subtle">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-layer-01 p-5 hover:bg-layer-02 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <kpi.icon className="h-4 w-4 text-text-tertiary" aria-hidden />
                <span className="text-xs text-text-tertiary">{kpi.label}</span>
              </div>
              <div className="text-3xl font-semibold tracking-tight text-text-primary">
                {kpi.value}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {kpi.change === "—" ? (
                  <span className="text-xs text-text-tertiary">{kpi.period}</span>
                ) : (
                  <>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-accent" aria-hidden />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-danger" aria-hidden />
                    )}
                    <span
                      className={`text-xs font-medium ${kpi.trend === "up" ? "text-accent" : "text-danger"}`}
                    >
                      {kpi.change}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {kpi.period}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 border border-border-subtle bg-layer-01">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
              <div>
                <h2 className="text-sm font-medium text-text-primary">
                  {t("gettingStarted")}
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {t("gettingStartedSub")}
                </p>
              </div>
              <Link
                href="/dashboard/studio"
                className="text-xs text-interactive hover:text-primary flex items-center gap-1 transition-colors"
              >
                {t("openStudio")} <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            <div className="px-5 py-8 text-sm text-text-secondary leading-relaxed">
              {showPlatformAdmin ? (
                <div>
                  {t.rich("bodyAdmin", {
                    link: (chunks) => (
                      <Link
                        href="/admin"
                        className="font-medium text-interactive hover:text-primary"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </div>
              ) : (
                <p>{t("bodyNonAdmin")}</p>
              )}
            </div>
          </div>

          <div className="border border-border-subtle bg-layer-01">
            <div className="px-5 py-3 border-b border-border-subtle">
              <h2 className="text-sm font-medium text-text-primary">
                {t("recentActivity")}
              </h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-sm text-text-tertiary">
                {t("recentActivityEmpty")}
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="px-5 py-3">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {activity.text}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
