/**
 * Minimal OpenAI API reachability check (no model generation).
 * Used when STUDIO_INTEGRATIONS_ENABLED and credentials exist.
 */

export async function verifyOpenAiApiKey(apiKey: string): Promise<
  | { ok: true }
  | { ok: false; status: number; bodySnippet: string }
> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/models?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
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
