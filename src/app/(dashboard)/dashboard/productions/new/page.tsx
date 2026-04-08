import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductionsNewHandoffForm } from "@/components/dashboard/productions-new-handoff-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.productions");
  return { title: t("newMetaTitle") };
}

export default async function ProductionsNewPage() {
  const t = await getTranslations("Dashboard.productions");

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <header className="mb-8 rounded-2xl border border-border-subtle bg-gradient-to-br from-layer-01 via-[#f0f4ff]/40 to-layer-02 px-6 py-6 shadow-sm dark:via-[#0a1628]/60">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t("newMetaTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
          {t("newSubtitle")}
        </p>
      </header>
      <ProductionsNewHandoffForm />
    </div>
  );
}
