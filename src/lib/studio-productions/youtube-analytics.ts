/**
 * YouTube Analytics API integration — fetch video performance metrics.
 * Uses YouTube Analytics API (v2) and YouTube Data API (v3) for video stats.
 *
 * @see https://developers.google.com/youtube/analytics/reference
 * @see https://developers.google.com/youtube/v3/docs/videos
 */
import "server-only";

const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_ANALYTICS_URL = "https://youtubeanalytics.googleapis.com/v2/reports";

export type VideoMetrics = {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  watchTimeMinutes: number;
  averageViewDurationSeconds: number;
  averageViewPercentage: number;
  impressions: number;
  clickThroughRate: number;
  estimatedRevenueUsd: number;
  subscriberChange: number;
  shares: number;
};

/**
 * Fetch basic video statistics from YouTube Data API v3.
 * Does not require Analytics scope, uses standard API key or OAuth token.
 */
export async function fetchVideoStatistics(
  accessToken: string,
  videoId: string,
): Promise<Partial<VideoMetrics> | null> {
  const url = `${YOUTUBE_VIDEOS_URL}?part=statistics,contentDetails&id=${encodeURIComponent(videoId)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) return null;

  const stats = items[0].statistics ?? {};

  return {
    videoId,
    views: parseInt(stats.viewCount ?? "0", 10),
    likes: parseInt(stats.likeCount ?? "0", 10),
    comments: parseInt(stats.commentCount ?? "0", 10),
    watchTimeMinutes: 0,
    averageViewDurationSeconds: 0,
    averageViewPercentage: 0,
    impressions: 0,
    clickThroughRate: 0,
    estimatedRevenueUsd: 0,
    subscriberChange: 0,
    shares: 0,
  };
}

/**
 * Fetch detailed analytics from YouTube Analytics API (requires analytics scope).
 * Returns metrics for a specific video over a date range.
 */
export async function fetchVideoAnalytics(
  accessToken: string,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<VideoMetrics | null> {
  const params = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost,impressions,impressionClickThroughRate,estimatedRevenue",
    dimensions: "video",
    filters: `video==${videoId}`,
    sort: "-views",
  });

  const url = `${YOUTUBE_ANALYTICS_URL}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const rows = data.rows;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row = rows[0];
  return {
    videoId,
    views: row[1] ?? 0,
    watchTimeMinutes: row[2] ?? 0,
    averageViewDurationSeconds: row[3] ?? 0,
    averageViewPercentage: row[4] ?? 0,
    likes: row[5] ?? 0,
    comments: row[6] ?? 0,
    shares: row[7] ?? 0,
    subscriberChange: (row[8] ?? 0) - (row[9] ?? 0),
    impressions: row[10] ?? 0,
    clickThroughRate: row[11] ?? 0,
    estimatedRevenueUsd: row[12] ?? 0,
  };
}

/**
 * Fetch metrics for multiple videos and return a summary.
 * Useful for channel dashboard aggregation.
 */
export async function fetchChannelVideosSummary(
  accessToken: string,
  videoIds: string[],
): Promise<Map<string, Partial<VideoMetrics>>> {
  const results = new Map<string, Partial<VideoMetrics>>();

  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const ids = batch.join(",");
    const url = `${YOUTUBE_VIDEOS_URL}?part=statistics&id=${encodeURIComponent(ids)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) continue;

    const data = await res.json();
    for (const item of data.items ?? []) {
      const stats = item.statistics ?? {};
      results.set(item.id, {
        videoId: item.id,
        views: parseInt(stats.viewCount ?? "0", 10),
        likes: parseInt(stats.likeCount ?? "0", 10),
        comments: parseInt(stats.commentCount ?? "0", 10),
      });
    }
  }

  return results;
}
