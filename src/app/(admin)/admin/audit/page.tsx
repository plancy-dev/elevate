import { redirect } from "next/navigation";

/** Legacy URL — org audit logs live under the dashboard organization console. */
export default function LegacyAdminAuditRedirect() {
  redirect("/dashboard/organization/audit");
}
