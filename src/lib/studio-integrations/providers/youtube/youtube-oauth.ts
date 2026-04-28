/**
 * YouTube OAuth 2.0 server-side flow for channel access.
 * Uses Google's Authorization Code flow to obtain refresh + access tokens.
 *
 * Flow: User clicks "Connect Channel" → redirect to Google → callback with code
 * → exchange for tokens → encrypt and store in studio_youtube_channel_tokens.
 *
 * @see https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
 */
import "server-only";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNEL_URL = "https://www.googleapis.com/youtube/v3/channels";

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join("");

export type YouTubeOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type YouTubeTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  channelId: string;
  channelTitle: string;
};

export function buildYouTubeAuthUrl(
  config: YouTubeOAuthConfig,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  config: YouTubeOAuthConfig,
  code: string,
): Promise<YouTubeTokens | null> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return null;

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;
  const refreshToken = tokenData.refresh_token as string;
  const expiresIn = (tokenData.expires_in as number) ?? 3600;

  if (!accessToken || !refreshToken) return null;

  const channel = await fetchChannelInfo(accessToken);
  if (!channel) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    channelId: channel.id,
    channelTitle: channel.title,
  };
}

export async function refreshAccessToken(
  config: YouTubeOAuthConfig,
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) return null;

  const data = await tokenRes.json();
  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) ?? 3600;

  if (!accessToken) return null;

  return {
    accessToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

async function fetchChannelInfo(
  accessToken: string,
): Promise<{ id: string; title: string } | null> {
  const url = `${YOUTUBE_CHANNEL_URL}?part=snippet&mine=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) return null;

  return {
    id: items[0].id,
    title: items[0].snippet?.title ?? "Unknown Channel",
  };
}
