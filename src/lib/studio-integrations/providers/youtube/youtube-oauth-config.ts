import type { YouTubeOAuthConfig } from "@/lib/studio-integrations/providers/youtube/youtube-oauth";

export function getYoutubeOAuthConfigFromEnv(): YouTubeOAuthConfig | null {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isYoutubeOAuthEnvConfigured(): boolean {
  return getYoutubeOAuthConfigFromEnv() !== null;
}
