import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PromptStudioBetaAllowlistAdminClient } from "@/components/admin/prompt-studio-beta-allowlist-admin-client";
import { listPromptStudioBetaAllowlist } from "@/actions/prompt-studio-beta-allowlist-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminPromptStudioAllowlist");
  return { title: t("metaTitle") };
}

export default async function AdminPromptStudioAllowlistPage() {
  const t = await getTranslations("Dashboard.adminPromptStudioAllowlist");
  const tAdmin = await getTranslations("Dashboard.admin");

  const listed = await listPromptStudioBetaAllowlist();
  const rows = listed.ok ? listed.rows : [];

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
      <div className="p-6 max-w-3xl">
        {!listed.ok ? (
          <p className="text-sm text-danger" role="alert">
            {listed.error}
          </p>
        ) : (
          <PromptStudioBetaAllowlistAdminClient initialRows={rows} />
        )}
      </div>
    </div>
  );
}
