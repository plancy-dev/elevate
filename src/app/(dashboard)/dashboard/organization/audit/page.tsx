import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import {
  type AuditLogRow,
  listAuditLogsForOrg,
} from "@/lib/data/audit";
import { AuditLogView } from "@/components/dashboard/audit-log-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.audit");
  return { title: t("metaTitle") };
}

export default async function OrganizationAuditLogPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

  const t = await getTranslations("Dashboard.audit");
  const tOrg = await getTranslations("Dashboard.organization");

  let rows: AuditLogRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await listAuditLogsForOrg(ensured.organizationId);
  } catch (e) {
    loadError = e instanceof Error ? e.message : t("loadError");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
        <Link
          href="/dashboard/team"
          className="text-xs text-interactive hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {tOrg("backFromAudit")}
        </Link>
      </div>
      <div className="p-6">
        <AuditLogView loadError={loadError} rows={rows} />
      </div>
    </div>
  );
}
