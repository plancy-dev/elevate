/**
 * Minimal YouTube Data API v3 key check — tiny search, no OAuth.
 */

export async function verifyYoutubeDataApiKey(apiKey: string): Promise<
  | { ok: true }
  | { ok: false; status: number }
> {
  const key = apiKey.trim();
  if (!key) return { ok: false, status: 0 };

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", "elevate");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", key);

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    return { ok: false, status: res.status };
  } finally {
    clearTimeout(tid);
  }
}
