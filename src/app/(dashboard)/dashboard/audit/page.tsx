import { redirect } from "next/navigation";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import {
  type AuditLogRow,
  listAuditLogsForOrg,
} from "@/lib/data/audit";
import { createClient } from "@/lib/supabase/server";
import { AuditLogView } from "@/components/dashboard/audit-log-view";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "admin") {
    redirect("/dashboard");
  }

  let rows: AuditLogRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await listAuditLogsForOrg(ensured.organizationId);
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load audit logs. Is migration 007 applied?";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Audit log</h1>
      </div>
      <div className="p-6">
        <AuditLogView loadError={loadError} rows={rows} />
      </div>
    </div>
  );
}
