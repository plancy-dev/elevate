import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductionsNewHandoffForm } from "@/components/dashboard/productions-new-handoff-form";
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

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 rounded-xl border border-border-subtle bg-layer-01 px-5 py-5 sm:px-6 sm:py-6">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t("newMetaTitle")}
          </h1>
          <p className="mt-4 text-sm text-text-secondary">{t("listEmpty")}</p>
        </header>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-8 rounded-xl border border-border-subtle bg-layer-01 px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t("newMetaTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {t("newSubtitle")}
        </p>
      </header>
      <ProductionsNewHandoffForm />
    </div>
  );
}
