/**
 * ElevenLabs TTS: text-to-speech via REST API.
 * Returns a presigned URL to the generated audio or raw audio bytes.
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech
 */

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export type ElevenLabsTtsOptions = {
  text: string;
  voiceId?: string;
  modelId?: string;
  language?: string;
  stability?: number;
  similarityBoost?: number;
};

export type ElevenLabsTtsResult =
  | { ok: true; audioBuffer: ArrayBuffer; contentType: string }
  | { ok: false; code: "elevenlabs_empty_text" | "elevenlabs_api_error" | "elevenlabs_timeout"; message?: string };

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export async function generateElevenLabsTts(
  apiKey: string,
  opts: ElevenLabsTtsOptions,
): Promise<ElevenLabsTtsResult> {
  const text = opts.text.trim();
  if (!text) {
    return { ok: false, code: "elevenlabs_empty_text" };
  }

  const voiceId = opts.voiceId || DEFAULT_VOICE_ID;
  const url = `${ELEVENLABS_TTS_URL}/${voiceId}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey.trim(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: opts.modelId || DEFAULT_MODEL_ID,
        voice_settings: {
          stability: opts.stability ?? 0.5,
          similarity_boost: opts.similarityBoost ?? 0.75,
        },
        ...(opts.language ? { language_code: opts.language } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        code: "elevenlabs_api_error",
        message: `${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const audioBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "audio/mpeg";

    return { ok: true, audioBuffer, contentType };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, code: "elevenlabs_timeout" };
    }
    return {
      ok: false,
      code: "elevenlabs_api_error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  } finally {
    clearTimeout(tid);
  }
}
