/**
 * YouTube Data API v3 — video upload (resumable) with metadata.
 * Uses videos.insert with resumable upload for network resilience.
 *
 * @see https://developers.google.com/youtube/v3/guides/uploading_a_video
 * @see https://developers.google.com/youtube/v3/docs/videos/insert
 */
import "server-only";

const YOUTUBE_UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails";

export type YouTubeUploadParams = {
  accessToken: string;
  videoBuffer: Buffer;
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: "private" | "public" | "unlisted";
  isShort?: boolean;
  aiGenerated?: boolean;
  scheduledPublishAt?: string;
};

export type YouTubeUploadResult =
  | { ok: true; videoId: string; videoUrl: string }
  | { ok: false; code: "upload_init_failed" | "upload_failed" | "quota_exceeded"; message?: string };

/**
 * Upload a video to YouTube using resumable upload protocol.
 * Initial privacy is `private` by default (Human-in-the-Loop).
 */
export async function uploadVideoToYouTube(
  params: YouTubeUploadParams,
): Promise<YouTubeUploadResult> {
  const privacy = params.privacyStatus ?? "private";

  const title = params.isShort && !params.title.includes("#Shorts")
    ? `${params.title} #Shorts`
    : params.title;

  const description = params.aiGenerated
    ? `${params.description}\n\n---\nThis video was created with AI assistance.`
    : params.description;

  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags: params.tags?.slice(0, 30) ?? [],
      categoryId: params.categoryId ?? "22",
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
      ...(params.scheduledPublishAt && privacy === "private"
        ? { publishAt: params.scheduledPublishAt }
        : {}),
    },
  };

  const initRes = await fetch(YOUTUBE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(params.videoBuffer.byteLength),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify(metadata),
  });

  if (initRes.status === 403) {
    const errBody = await initRes.text().catch(() => "");
    if (errBody.includes("quotaExceeded") || errBody.includes("rateLimitExceeded")) {
      return { ok: false, code: "quota_exceeded", message: errBody.slice(0, 300) };
    }
  }

  if (!initRes.ok) {
    const errBody = await initRes.text().catch(() => "");
    return {
      ok: false,
      code: "upload_init_failed",
      message: `${initRes.status}: ${errBody.slice(0, 300)}`,
    };
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    return { ok: false, code: "upload_init_failed", message: "No upload URL in response" };
  }

  const uploadRes = await uploadWithRetry(uploadUrl, params.accessToken, params.videoBuffer);
  return uploadRes;
}

async function uploadWithRetry(
  uploadUrl: string,
  accessToken: string,
  videoBuffer: Buffer,
  maxRetries = 3,
): Promise<YouTubeUploadResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const bodyBlob = new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "video/mp4",
          "Content-Length": String(videoBuffer.byteLength),
        },
        body: bodyBlob,
      });

      if (res.ok) {
        const data = await res.json();
        const videoId = data.id as string;
        return {
          ok: true,
          videoId,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }

      const status = res.status;
      if (status === 500 || status === 502 || status === 503 || status === 504) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      const errBody = await res.text().catch(() => "");
      return {
        ok: false,
        code: "upload_failed",
        message: `${status}: ${errBody.slice(0, 300)}`,
      };
    } catch (err) {
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return {
        ok: false,
        code: "upload_failed",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { ok: false, code: "upload_failed", message: "Max retries exceeded" };
}
