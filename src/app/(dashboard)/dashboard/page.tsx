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
import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { ButtonLink } from "@/components/ui/button";
import { getLibraryPageData } from "@/lib/data/library";
import { listOrgMembers } from "@/lib/data/team";
import { canAccessOrganizationAdminConsole } from "@/lib/auth/platform-admin";
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
        <div className="max-w-lg rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
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

  const showOrgAdminOverview = canAccessOrganizationAdminConsole(
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
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border-subtle bg-background px-6 shadow-ambient">
        <div>
          <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-text-tertiary sm:inline">
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

      <div className="space-y-6 p-6">
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-layer-01 shadow-card">
          <div className="divide-y divide-border-subtle">
            <DashboardNavLink
              href="/dashboard/studio"
              className="group block p-6 transition-colors duration-150 hover:bg-layer-02"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {t("promptStudioBadge")}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("promptStudioHeadline")}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {t("promptStudioDesc")}
                  </p>
                </div>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-text-tertiary transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </div>
            </DashboardNavLink>
            <DashboardNavLink
              href="/dashboard/library"
              className="group block p-6 transition-colors duration-150 hover:bg-layer-02"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <BookOpen className="h-5 w-5" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {t("libraryBadge")}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {entitledLabel}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {t("libraryDesc")}
                  </p>
                </div>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-text-tertiary transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </div>
            </DashboardNavLink>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-border-subtle shadow-card">
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-layer-01 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <kpi.icon className="h-4 w-4 text-text-tertiary" aria-hidden />
                  <span className="text-xs text-text-tertiary">{kpi.label}</span>
                </div>
                <div className="text-3xl font-semibold tracking-tight text-text-primary">
                  {kpi.value}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
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
        </div>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-layer-01 shadow-card xl:grid xl:grid-cols-3">
          <div className="border-b border-border-subtle xl:col-span-2 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 pt-5 pb-3">
              <div>
                <h2 className="text-sm font-medium text-text-primary">
                  {t("gettingStarted")}
                </h2>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {t("gettingStartedSub")}
                </p>
              </div>
              <DashboardNavLink
                href="/dashboard/studio"
                layout="inline"
                className="flex shrink-0 items-center gap-1 text-xs text-interactive transition-colors hover:text-primary"
              >
                {t("openStudio")}{" "}
                <ArrowRight className="h-3 w-3" aria-hidden />
              </DashboardNavLink>
            </div>
            <div className="px-5 py-8 text-sm leading-relaxed text-text-secondary">
              {showOrgAdminOverview ? (
                <div>
                  {t.rich("bodyAdmin", {
                    link: (chunks) => (
                      <DashboardNavLink
                        href="/dashboard/team"
                        layout="inline"
                        className="font-medium text-interactive hover:text-primary"
                      >
                        {chunks}
                      </DashboardNavLink>
                    ),
                  })}
                </div>
              ) : (
                <p>{t("bodyNonAdmin")}</p>
              )}
            </div>
          </div>

          <div>
            <div className="border-b border-border-subtle px-5 pt-5 pb-3">
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
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {activity.text}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
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
