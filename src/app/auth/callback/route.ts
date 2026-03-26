import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const nextRaw = searchParams.get("next");
  const next = nextRaw?.startsWith("/") ? nextRaw : "/dashboard";

  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  const oauthErrorCode = searchParams.get("error_code");

  if (oauthError) {
    const login = new URL("/login", origin);
    login.searchParams.set("auth_error", oauthError);
    if (oauthErrorCode) {
      login.searchParams.set("auth_error_code", oauthErrorCode);
    }
    if (oauthDescription) {
      login.searchParams.set(
        "auth_error_description",
        oauthDescription.slice(0, 500),
      );
    }
    if (next !== "/dashboard") {
      login.searchParams.set("next", next);
    }
    return NextResponse.redirect(login);
  }

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
}
