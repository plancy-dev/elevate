import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Cable, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LemonWebhookTestClient } from "@/components/admin/lemon-webhook-test-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { LemonProductRow } from "@/components/admin/lemon-webhook-test-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminLemonWebhook");
  return { title: t("metaTitle") };
}

export default async function AdminLemonWebhookPage() {
  const t = await getTranslations("Dashboard.adminLemonWebhook");
  const tAdmin = await getTranslations("Dashboard.admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let organizationId: string | null = null;
  let profileEmail: string | null = null;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id, email")
      .eq("id", user.id)
      .maybeSingle();
    organizationId = prof?.organization_id ?? null;
    profileEmail = prof?.email?.trim().toLowerCase() ?? user.email?.trim().toLowerCase() ?? null;
  }

  let products: LemonProductRow[] = [];
  let loadError: string | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_products")
      .select("id, slug, title, is_active")
      .order("created_at", { ascending: false });
    if (error) {
      loadError = error.message;
    } else {
      products = (data ?? []) as LemonProductRow[];
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "unknown";
  }

  const origin = getSiteUrl();
  const webhookUrl = `${origin}/api/webhooks/lemonsqueezy`;
  const isLocalOrigin =
    origin.includes("localhost") || origin.startsWith("http://127.");

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-paper-50 px-6 h-12">
        <div className="flex items-center gap-2">
          <Cable className="h-4 w-4 text-primary" aria-hidden />
          <h1 className="text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-vermilion-600 hover:text-vermilion-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {tAdmin("backToOverview")}
        </Link>
      </div>

      <div className="p-6 max-w-4xl space-y-6">
        <p className="text-sm text-ink-700 leading-relaxed">{t("intro")}</p>

        <p className="text-sm">
          <Link
            href="/admin/content"
            className="text-vermilion-600 hover:text-vermilion-700 underline-offset-2 hover:underline"
          >
            {t("linkCatalog")}
          </Link>
        </p>

        {loadError ? (
          <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
            {t("loadError", { message: loadError })}
          </p>
        ) : null}

        {isLocalOrigin ? (
          <p className="text-sm text-amber-600 dark:text-amber-400" role="status">
            {t("localWebhookWarning")}
          </p>
        ) : null}

        <LemonWebhookTestClient
          organizationId={organizationId}
          profileEmail={profileEmail}
          products={products}
          webhookUrl={webhookUrl}
        />

        <div className="flex items-start gap-2 border border-ink-100 bg-paper-50 p-3 text-xs text-ink-500">
          <Shield className="h-4 w-4 shrink-0 mt-0.5 text-ink-700" aria-hidden />
          <p>{t("footerNote")}</p>
        </div>
      </div>
    </div>
  );
}
