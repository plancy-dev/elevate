import { NextResponse } from "next/server";
import { canUseDashboard } from "@/lib/auth/dashboard-access";
import { createClient } from "@/lib/supabase/server";

/**
 * Whether the **current session** may open `/dashboard` (same rules as the layout gate).
 * Used by the marketing header so we do not show a Dashboard CTA without access.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { allowed: false },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const allowed = await canUseDashboard(
    user.email ?? undefined,
    prof?.role,
    user.id,
  );

  return NextResponse.json(
    { allowed },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
