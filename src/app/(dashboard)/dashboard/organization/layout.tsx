import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessOrganizationAdminConsole } from "@/lib/auth/platform-admin";

export default async function OrganizationConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!canAccessOrganizationAdminConsole(prof?.role)) {
    redirect("/dashboard");
  }
  return children;
}
