/**
 * Minimal Buffer API key check — runs a tiny GraphQL `viewer` query that the
 * Buffer Publish API answers with the authenticated account when the bearer
 * token is valid. No posts are created.
 *
 * @see https://buffer.com/developers/api
 */

function resolveBufferGraphqlUrl(): string {
  const raw = process.env.BUFFER_API_URL?.trim();
  if (!raw) return "https://api.buffer.com/graphql";
  if (raw === "https://graph.buffer.com") return "https://api.buffer.com/graphql";
  return raw;
}

const BUFFER_GRAPHQL_URL = resolveBufferGraphqlUrl();

export async function verifyBufferApiKey(apiKey: string): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const token = apiKey.replace(/\s+/g, "").trim();
  if (!token) return { ok: false, status: 0 };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(BUFFER_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `query Ping { account { id } }`,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    const body = (await res.json().catch(() => ({}))) as {
      errors?: unknown[];
      data?: { account?: { id?: string } };
    };
    if (body.errors && body.errors.length > 0) {
      return { ok: false, status: 401 };
    }
    if (!body.data?.account?.id) {
      return { ok: false, status: 401 };
    }
    return { ok: true };
  } finally {
    clearTimeout(tid);
  }
}
