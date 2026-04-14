/**
 * Minimal Anthropic API reachability check — list models, no generation.
 * @see https://docs.anthropic.com/en/api/models-list
 */

const ANTHROPIC_API_VERSION = "2023-06-01";

export async function verifyAnthropicApiKey(apiKey: string): Promise<
  | { ok: true }
  | { ok: false; status: number; bodySnippet: string }
> {
  const key = apiKey.trim();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    const url = new URL("https://api.anthropic.com/v1/models");
    url.searchParams.set("limit", "1");
    res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }

  if (res.ok) {
    return { ok: true };
  }

  let bodySnippet = "";
  try {
    const t = await res.text();
    bodySnippet = t.slice(0, 200);
  } catch {
    bodySnippet = "";
  }
  return { ok: false, status: res.status, bodySnippet };
}
