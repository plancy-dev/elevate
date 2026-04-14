/**
 * Minimal Google AI (Gemini) API key check — list models, no generation.
 */

export async function verifyGoogleGeminiApiKey(apiKey: string): Promise<
  | { ok: true }
  | { ok: false; status: number }
> {
  const key = apiKey.trim();
  if (!key) return { ok: false, status: 0 };

  const url = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models",
  );
  url.searchParams.set("key", key);
  url.searchParams.set("pageSize", "1");

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
