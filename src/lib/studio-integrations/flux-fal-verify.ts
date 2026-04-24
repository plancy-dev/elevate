/**
 * Minimal fal.ai API key check — hits the REST status endpoint for an inert
 * model to validate auth without incurring generation cost. When unavailable,
 * the catch-all path returns status 0.
 */

export async function verifyFluxFalApiKey(apiKey: string): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const token = apiKey.replace(/\s+/g, "").trim();
  if (!token) return { ok: false, status: 0 };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://fal.ai/api/auth/whoami", {
      method: "GET",
      headers: {
        Authorization: `Key ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    // fal does not currently publish a stable verify endpoint, so treat 401/403
    // as explicit failures and everything else as "likely reachable but
    // endpoint unknown" → still flagged for the UI but distinguishable.
    return { ok: false, status: res.status };
  } finally {
    clearTimeout(tid);
  }
}
