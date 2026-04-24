/**
 * Minimal Replicate API key check — GET /v1/account returns the authenticated
 * account when the token is valid. Includes no generation side effects.
 */

export async function verifyFluxReplicateApiKey(apiKey: string): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const token = apiKey.replace(/\s+/g, "").trim();
  if (!token) return { ok: false, status: 0 };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://api.replicate.com/v1/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    return { ok: false, status: res.status };
  } finally {
    clearTimeout(tid);
  }
}
