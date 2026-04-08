import type { Metadata } from "next";
import { Sparkles, BookOpen, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudioBetaGated } from "@/components/dashboard/studio-beta-gated";
import { StudioSendToProductions } from "@/components/dashboard/studio-send-to-productions";
import { assertPromptStudioBetaAccess } from "@/lib/prompt-studio/assert-studio-beta-access";
import { createClient } from "@/lib/supabase/server";
import { listStudioEpisodesForOrg } from "@/lib/data/studio-productions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.studio");
  return { title: t("metaTitle") };
}

export default async function StudioPage() {
  const beta = await assertPromptStudioBetaAccess();
  if (!beta.ok) {
    return <StudioBetaGated reason={beta.reason} />;
  }

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
  const episodes = orgId
    ? await listStudioEpisodesForOrg(supabase, orgId)
    : [];
  const episodeOptions = episodes.map((e) => ({
    id: e.id,
    title: e.title,
  }));

  const t = await getTranslations("Dashboard.studio");
  const bullets = [t("bullet1"), t("bullet2"), t("bullet3")];

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {t("metaTitle")}
          </h1>
          <Badge variant="warm-gray">{t("badge")}</Badge>
        </div>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
          {t("intro")}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-text-secondary list-disc pl-5 max-w-2xl">
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8 mt-8 overflow-hidden rounded-xl border border-border-subtle bg-layer-01 shadow-card">
        <div className="border-b border-border-subtle p-5 lg:p-6">
          <StudioSendToProductions episodes={episodeOptions} />
        </div>
        <div className="flex min-h-[120px] flex-col items-center justify-center bg-layer-02/40 px-5 py-10 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-primary" aria-hidden />
          <p className="text-sm font-medium text-text-primary">{t("building")}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-text-tertiary">
            {t("note")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <ButtonLink href="/dashboard/library" variant="primary" size="lg">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          {t("ctaLibrary")}
        </ButtonLink>
        <ButtonLink href="/dashboard/productions" variant="secondary" size="lg">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          {t("ctaProductions")}
        </ButtonLink>
        <ButtonLink href="/dashboard/billing" variant="tertiary" size="lg">
          <CreditCard className="h-4 w-4 shrink-0" aria-hidden />
          {t("ctaBilling")}
        </ButtonLink>
      </div>
    </div>
  );
}
