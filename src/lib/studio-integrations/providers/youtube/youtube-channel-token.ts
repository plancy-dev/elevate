import "server-only";

import {
  decryptProviderSecret,
  encryptProviderSecret,
} from "@/lib/studio-integrations/crypto";
import {
  refreshAccessToken,
  type YouTubeOAuthConfig,
} from "@/lib/studio-integrations/providers/youtube/youtube-oauth";

type MaybeSingleResult<T> = Promise<{ data: T | null }>;
type UpdateResult = Promise<{ error: unknown }>;
type UpsertResult = Promise<{ error: unknown }>;

type YouTubeChannelTokenSelectQuery = {
  eq: (column: string, value: string) => YouTubeChannelTokenSelectQuery;
  limit: (value: number) => YouTubeChannelTokenSelectQuery;
  maybeSingle: () => MaybeSingleResult<StudioYouTubeChannelTokenRow>;
};

type YouTubeChannelTokenTable = {
  select: (_columns: string) => YouTubeChannelTokenSelectQuery;
  update: (_values: Record<string, unknown>) => {
    eq: (_column: string, _value: string) => UpdateResult;
  };
  upsert: (
    _values: Record<string, unknown>,
    _options: { onConflict: string },
  ) => UpsertResult;
};

export type UntypedSupabaseClient = {
  from: (_table: "studio_youtube_channel_tokens") => YouTubeChannelTokenTable;
};

export type StudioYouTubeChannelTokenRow = {
  id: string;
  organization_id: string;
  channel_id: string;
  channel_title: string | null;
  access_token_cipher: string;
  refresh_token_cipher: string;
  token_expiry: string | null;
};

export async function getStudioYouTubeChannelToken(
  supabase: UntypedSupabaseClient,
  organizationId: string,
): Promise<StudioYouTubeChannelTokenRow | null> {
  const { data } = await supabase
    .from("studio_youtube_channel_tokens")
    .select("*")
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

/**
 * Resolves a valid access token, refreshing and persisting when expired.
 */
export async function resolveStudioYouTubeAccessToken(
  supabase: UntypedSupabaseClient,
  channelToken: StudioYouTubeChannelTokenRow,
  config: YouTubeOAuthConfig,
): Promise<string | null> {
  const tokenExpiry = channelToken.token_expiry
    ? new Date(channelToken.token_expiry)
    : null;
  const isExpired = !tokenExpiry || tokenExpiry < new Date();

  if (!isExpired) {
    return decryptProviderSecret(channelToken.access_token_cipher);
  }

  const refreshToken = decryptProviderSecret(channelToken.refresh_token_cipher);
  const refreshed = await refreshAccessToken(config, refreshToken);
  if (!refreshed) return null;

  await supabase
    .from("studio_youtube_channel_tokens")
    .update({
      access_token_cipher: encryptProviderSecret(refreshed.accessToken),
      token_expiry: refreshed.expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", channelToken.id);

  return refreshed.accessToken;
}

export async function touchStudioYouTubeChannelToken(
  supabase: UntypedSupabaseClient,
  tokenId: string,
): Promise<void> {
  await supabase
    .from("studio_youtube_channel_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);
}

export async function upsertStudioYouTubeChannelToken(
  supabase: UntypedSupabaseClient,
  row: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await supabase
    .from("studio_youtube_channel_tokens")
    .upsert(row, { onConflict: "organization_id,channel_id" });

  return !error;
}
