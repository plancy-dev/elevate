/**
 * Minimal BytePlus Seedream (ModelArk) API key check — hits the models list
 * endpoint to confirm the bearer token is accepted without incurring cost.
 */

const SEEDREAM_VERIFY_URL =
  process.env.BYTEPLUS_SEEDREAM_VERIFY_URL?.trim() ||
  "https://ark.ap-southeast.bytepluses.com/api/v3/models";

export async function verifySeedreamApiKey(apiKey: string): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const token = apiKey.replace(/\s+/g, "").trim();
  if (!token) return { ok: false, status: 0 };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(SEEDREAM_VERIFY_URL, {
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
