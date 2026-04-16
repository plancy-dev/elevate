import { redirect } from "next/navigation";

export default function ProductionsIntegrationsRedirectPage() {
  redirect("/dashboard/productions?studio=integrations");
}
