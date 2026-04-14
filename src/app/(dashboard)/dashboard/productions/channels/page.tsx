import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StudioDistributionChannelsPanel } from "@/components/dashboard/studio-distribution-channels-panel";
import { createClient } from "@/lib/supabase/server";
import { listStudioDistributionChannelsForOrg } from "@/lib/studio-productions/shorts-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.productions");
  return { title: t("channelsMetaTitle") };
}

export default async function ProductionsChannelsPage() {
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

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {t("channelsMetaTitle")}
        </h1>
        <p className="mt-4 text-sm text-text-secondary">{t("listEmpty")}</p>
      </div>
    );
  }

  const channels = await listStudioDistributionChannelsForOrg(supabase, orgId);

  return (
    <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/productions"
          className="text-sm font-medium text-interactive hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {t("channelsMetaTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-tertiary max-w-2xl leading-relaxed">
          {t("channelsPageSubtitle")}
        </p>
      </header>
      <StudioDistributionChannelsPanel channels={channels} />
    </div>
  );
}
