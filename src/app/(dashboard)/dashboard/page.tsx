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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card hoverable className="p-0">
            <Link href="/dashboard/studio" className="group block p-6">
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
            </Link>
          </Card>
          <Card hoverable className="p-0">
            <Link href="/dashboard/library" className="group block p-6">
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
            </Link>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
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
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium text-text-primary">
                    {t("gettingStarted")}
                  </h2>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {t("gettingStartedSub")}
                  </p>
                </div>
                <Link
                  href="/dashboard/studio"
                  className="flex shrink-0 items-center gap-1 text-xs text-interactive transition-colors hover:text-primary"
                >
                  {t("openStudio")}{" "}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-8 text-sm leading-relaxed text-text-secondary">
              {showOrgAdminOverview ? (
                <div>
                  {t.rich("bodyAdmin", {
                    link: (chunks) => (
                      <Link
                        href="/dashboard/team"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium text-text-primary">
                {t("recentActivity")}
              </h2>
            </CardHeader>
            {recentActivity.length === 0 ? (
              <CardContent className="py-8 text-sm text-text-tertiary">
                {t("recentActivityEmpty")}
              </CardContent>
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
          </Card>
        </div>
      </div>
    </div>
  );
}
