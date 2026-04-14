/**
 * Minimal Runway API key check — same as official SDK `organization.retrieve()`:
 * `GET /v1/organization` (usage tier / balance for the key’s org). No generation.
 *
 * Note: `@runwayml/sdk` only exposes `GET /v1/tasks/{id}` for tasks, not a list endpoint.
 * A previous implementation used `GET /v1/tasks?offset&limit`, which is not in the public SDK
 * and can fail even with a valid key.
 *
 * Runway requires `X-Runway-Version` on every request; without it the API returns 400.
 * @see https://docs.dev.runwayml.com/api-details/versioning
 */
export const RUNWAY_API_VERSION = "2024-11-06";

const RUNWAY_VERIFY_URL = "https://api.dev.runwayml.com/v1/organization";

export async function verifyRunwayApiKey(apiKey: string): Promise<
  | { ok: true }
  | { ok: false; status: number }
> {
  /** Keys are `key_` + 128 hex; paste errors often include newlines or spaces. */
  const token = apiKey.replace(/\s+/g, "").trim();
  if (!token) return { ok: false, status: 0 };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(RUNWAY_VERIFY_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Runway-Version": RUNWAY_API_VERSION,
      },
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    return { ok: false, status: res.status };
  } finally {
    clearTimeout(tid);
  }
}
