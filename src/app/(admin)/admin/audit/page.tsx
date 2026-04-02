import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export default async function AdminAuditLogPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

  const t = await getTranslations("Dashboard.audit");

  let rows: AuditLogRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await listAuditLogsForOrg(ensured.organizationId);
  } catch (e) {
    loadError = e instanceof Error ? e.message : t("loadError");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
      </div>
      <div className="p-6">
        <AuditLogView loadError={loadError} rows={rows} />
      </div>
    </div>
  );
}
