import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { completeYoutubeOAuthConnection } from "@/lib/studio-integrations/providers/youtube/complete-youtube-oauth-connection";
import { getRequestOrigin } from "@/lib/http/request-origin";

const STATE_COOKIE = "studio_yt_oauth_state";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const productions = `${origin}/dashboard/productions`;
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (oauthError) {
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!code?.trim() || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=invalid_state`,
    );
  }

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

  const done = await completeYoutubeOAuthConnection(
    supabase,
    auth.ctx.organizationId,
    code.trim(),
  );
  if (!done.ok) {
    return NextResponse.redirect(
      `${productions}?studio=channels&youtube_error=${encodeURIComponent(done.error)}`,
    );
  }

  revalidatePath("/dashboard/productions");
  return NextResponse.redirect(
    `${productions}?studio=channels&youtube_connected=1`,
  );
}
