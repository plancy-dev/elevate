import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductionsNewHandoffForm } from "@/components/dashboard/productions-new-handoff-form";
import { listStudioProjectsForOrg } from "@/lib/data/studio-projects";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.productions");
  return { title: t("newMetaTitle") };
}

export default async function ProductionsNewPage() {
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

  const studioProjects =
    orgId != null
      ? await listStudioProjectsForOrg(supabase, orgId)
      : [];

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t("newMetaTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {t("listEmpty")}
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t("newMetaTitle")}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-700">
          {t("newSubtitle")}
        </p>
      </header>
      <ProductionsNewHandoffForm
        projects={studioProjects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
