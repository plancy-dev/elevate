/**
 * Minimal ElevenLabs API key check — GET /v1/user to verify the key works.
 * @see https://elevenlabs.io/docs/api-reference/get-user
 */

const ELEVENLABS_VERIFY_URL = "https://api.elevenlabs.io/v1/user";

export async function verifyElevenLabsApiKey(apiKey: string): Promise<
  | { ok: true }
  | { ok: false; status: number }
> {
  const token = apiKey.trim();
  if (!token) return { ok: false, status: 0 };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(ELEVENLABS_VERIFY_URL, {
      method: "GET",
      headers: {
        "xi-api-key": token,
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
