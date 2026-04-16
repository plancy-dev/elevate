"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { type YouTubeOAuthConfig } from "@/lib/studio-integrations/providers/youtube/youtube-oauth";
import {
  getStudioYouTubeChannelToken,
  resolveStudioYouTubeAccessToken,
  type UntypedSupabaseClient,
} from "@/lib/studio-integrations/providers/youtube/youtube-channel-token";
import { fetchVideoStatistics } from "@/lib/studio-productions/youtube-analytics";

export type AnalyticsActionState = {
  ok?: boolean;
  error?: string;
  syncedCount?: number;
};

function getYouTubeOAuthConfig(): YouTubeOAuthConfig | null {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

/**
 * Sync YouTube performance metrics for all published episodes in the org.
 */
export async function syncEpisodePerformance(
  _prev: AnalyticsActionState | null,
): Promise<AnalyticsActionState> {
  void _prev;
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const config = getYouTubeOAuthConfig();
  if (!config) return { error: "studioYoutubeOAuthNotConfigured" };

  const ytTokenClient = supabase as unknown as UntypedSupabaseClient;
  const channelToken = await getStudioYouTubeChannelToken(
    ytTokenClient,
    auth.ctx.organizationId,
  );

  if (!channelToken) return { error: "studioAnalyticsNoChannel" };

  const accessToken = await resolveStudioYouTubeAccessToken(
    ytTokenClient,
    channelToken,
    config,
  );
  if (!accessToken) return { error: "studioYoutubeTokenRefreshFailed" };

  const { data: episodes } = await supabase
    .from("studio_production_episodes")
    .select("id, publish_url")
    .eq("organization_id", auth.ctx.organizationId)
    .not("publish_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!episodes || episodes.length === 0) {
    return { ok: true, syncedCount: 0 };
  }

  let syncedCount = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const episode of episodes) {
    const videoId = extractYoutubeVideoId(episode.publish_url ?? "");
    if (!videoId) continue;

    const metrics = await fetchVideoStatistics(accessToken, videoId);
    if (!metrics) continue;

    // New table not yet in generated types
    const { error: upsertErr } = await (supabase as unknown as {
      from: (
        table: "studio_episode_performance",
      ) => {
        upsert: (
          values: Record<string, unknown>,
          options: { onConflict: string },
        ) => Promise<{ error: unknown }>;
      };
    })
      .from("studio_episode_performance")
      .upsert(
        {
          organization_id: auth.ctx.organizationId,
          episode_id: episode.id,
          youtube_video_id: videoId,
          snapshot_date: today,
          views: metrics.views ?? 0,
          likes: metrics.likes ?? 0,
          comments: metrics.comments ?? 0,
          watch_time_minutes: metrics.watchTimeMinutes ?? 0,
          average_view_duration_seconds: metrics.averageViewDurationSeconds ?? null,
          average_view_percentage: metrics.averageViewPercentage ?? null,
          impressions: metrics.impressions ?? 0,
          click_through_rate: metrics.clickThroughRate ?? null,
          estimated_revenue_usd: metrics.estimatedRevenueUsd ?? null,
          subscriber_change: metrics.subscriberChange ?? 0,
          shares: metrics.shares ?? 0,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "episode_id,snapshot_date" },
      );

    if (!upsertErr) syncedCount++;
  }

  revalidatePath("/dashboard/productions");
  return { ok: true, syncedCount };
}

function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}
