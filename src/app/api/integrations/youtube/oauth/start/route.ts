import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { buildYouTubeAuthUrl } from "@/lib/studio-integrations/providers/youtube/youtube-oauth";
import { getYoutubeOAuthConfigFromEnv } from "@/lib/studio-integrations/providers/youtube/youtube-oauth-config";
import { getRequestOrigin } from "@/lib/http/request-origin";

const STATE_COOKIE = "studio_yt_oauth_state";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const productions = `${origin}/dashboard/productions`;

  if (!readStudioIntegrationsServerEnabled()) {
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=integrations_disabled`,
    );
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=encryption_not_configured`,
    );
  }

  const config = getYoutubeOAuthConfigFromEnv();
  if (!config) {
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=oauth_not_configured`,
    );
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) {
    if (auth.error === ActionErrorCode.authNotAuthenticated) {
      return NextResponse.redirect(`${origin}/login`);
    }
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=${encodeURIComponent(auth.error)}`,
    );
  }

  const state = randomBytes(32).toString("base64url");
  const url = buildYouTubeAuthUrl(config, state);

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: isProd,
  });

  return NextResponse.redirect(url);
}
