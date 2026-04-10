import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContentProductsAdminClient } from "@/components/admin/content-products-admin-client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type ContentProductRow = Database["public"]["Tables"]["content_products"]["Row"];
type LemonLinkRow = Database["public"]["Tables"]["content_product_lemon_links"]["Row"];

type ContentProductWithLemon = ContentProductRow & {
  lemonLink: LemonLinkRow | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminContent");
  return { title: t("metaTitle") };
}

export default async function AdminContentCatalogPage() {
  const t = await getTranslations("Dashboard.adminContent");
  const tAdmin = await getTranslations("Dashboard.admin");
  let rows: ContentProductWithLemon[] = [];
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      loadError = error.message;
    } else {
      const catalog = data ?? [];
      const ids = catalog.map((r) => r.id);
      const linkMap = new Map<string, LemonLinkRow>();
      if (ids.length > 0) {
        const { data: links } = await admin
          .from("content_product_lemon_links")
          .select("*")
          .in("content_product_id", ids);
        for (const link of links ?? []) {
          linkMap.set(link.content_product_id, link);
        }
      }
      rows = catalog.map((r) => ({
        ...r,
        lemonLink: linkMap.get(r.id) ?? null,
      }));
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "unknown";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-interactive hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {tAdmin("backToOverview")}
        </Link>
      </div>

      <div className="p-6 max-w-6xl space-y-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm text-text-secondary leading-relaxed">{t("intro")}</p>
          <p className="text-sm text-text-tertiary leading-relaxed">{t("lemonBlurb")}</p>
        </div>

        {loadError ? (
          <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
            {loadError}
          </p>
        ) : null}

        <ContentProductsAdminClient initialRows={rows} />
      </div>
    </div>
  );
}
