import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { createClient } from "@/lib/supabase/server";
import { blogMdxComponents } from "@/components/blog/mdx-components";
import { isValidCatalogSlug } from "@/lib/content/catalog-slug";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";
import { loadEbookMdxSource } from "@/lib/content/ebook-mdx";
import { recordEbookFirstOpen } from "@/lib/content/ebook-first-open";
import { getOrganizationCatalogAccess } from "@/lib/data/organization-catalog-access";
import { FunnelCaptureOnce } from "@/components/analytics/funnel-capture";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

/** Reader is auth-gated; avoid caching HTML that could mix sessions. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidCatalogSlug(slug)) {
    return { title: "Library" };
  }
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("content_products")
    .select("title")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const t = await getTranslations("Dashboard.library");
  if (!product?.title) {
    return { title: t("metaTitle") };
  }
  return { title: t("readerMetaTitle", { title: product.title }) };
}

export default async function EbookReaderPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidCatalogSlug(slug)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const access = await getOrganizationCatalogAccess(supabase, user.id);
  if (!access) notFound();

  const { data: product, error: pErr } = await supabase
    .from("content_products")
    .select("id, title, delivery_mode")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (pErr || !product) notFound();
  if (product.delivery_mode !== "web_only") notFound();

  const canRead = canReadCatalogProduct({
    organizationPlan: access.organizationPlan,
    entitledProductIds: access.entitledProductIds,
    productId: product.id,
  });

  if (!canRead) notFound();

  const source = loadEbookMdxSource(slug);

  await recordEbookFirstOpen(supabase, {
    organizationId: access.orgId,
    userId: user.id,
    contentProductId: product.id,
  });

  const t = await getTranslations("Dashboard.library");

  return (
    <div className="mx-auto w-full max-w-[720px] p-6 lg:p-8">
      <FunnelCaptureOnce
        event={PostHogEvent.ELEVATE_FUNNEL_EBOOK_READER_VIEW}
        properties={{ product_id: product.id, slug }}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">
          {product.title}
        </h1>
        <p className="mt-4 text-xs text-ink-500 leading-relaxed max-w-prose">
          {t("readerUsageNotice")}
        </p>
      </div>

      {source ? (
        <div className="prose-blog">
          <MDXRemote source={source} components={blogMdxComponents} />
        </div>
      ) : (
        <p className="text-sm text-ink-700 leading-relaxed">
          {t("readerEmpty")}
        </p>
      )}

      <div className="mt-14 border-t border-ink-100 pt-8">
        <Link
          href="/dashboard/library"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("readerBackToLibrary")}
        </Link>
      </div>
    </div>
  );
}
