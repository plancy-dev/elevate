import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { encryptProviderSecret } from "@/lib/studio-integrations/crypto";
import { exchangeCodeForTokens } from "@/lib/studio-integrations/providers/youtube/youtube-oauth";
import { getYoutubeOAuthConfigFromEnv } from "@/lib/studio-integrations/providers/youtube/youtube-oauth-config";
import {
  upsertStudioYouTubeChannelToken,
  type UntypedSupabaseClient,
} from "@/lib/studio-integrations/providers/youtube/youtube-channel-token";

/**
 * Exchanges an OAuth authorization code and stores encrypted tokens for the organization.
 * Used by the server action and the OAuth callback route.
 */
export async function completeYoutubeOAuthConnection(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getYoutubeOAuthConfigFromEnv();
  if (!config) return { ok: false, error: "studioYoutubeOAuthNotConfigured" };

  const tokens = await exchangeCodeForTokens(config, code);
  if (!tokens) return { ok: false, error: "studioYoutubeTokenExchangeFailed" };

  const ytTokenClient = supabase as unknown as UntypedSupabaseClient;
  const upsertOk = await upsertStudioYouTubeChannelToken(ytTokenClient, {
    organization_id: organizationId,
    channel_id: tokens.channelId,
    channel_title: tokens.channelTitle,
    access_token_cipher: encryptProviderSecret(tokens.accessToken),
    refresh_token_cipher: encryptProviderSecret(tokens.refreshToken),
    scopes:
      "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    token_expiry: tokens.expiresAt.toISOString(),
    connected_at: new Date().toISOString(),
  });

  if (!upsertOk) return { ok: false, error: "studioYoutubeTokenSaveFailed" };
  return { ok: true };
}
