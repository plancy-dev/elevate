import { redirect } from "next/navigation";

export default function LegacyAuditRedirect() {
  redirect("/admin/audit");
}
