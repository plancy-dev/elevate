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
  /** 0–1, expressive style (model-dependent; omitted when undefined). */
  style?: number;
  useSpeakerBoost?: boolean;
};

export type ElevenLabsErrorCode =
  | "elevenlabs_empty_text"
  | "elevenlabs_api_error"
  | "elevenlabs_auth_error"
  | "elevenlabs_quota_exceeded"
  | "elevenlabs_timeout";

export type ElevenLabsTtsResult =
  | { ok: true; audioBuffer: ArrayBuffer; contentType: string }
  | { ok: false; code: ElevenLabsErrorCode; message?: string };

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL_ID = "eleven_multilingual_v3";

/** ElevenLabs sometimes returns 401 with JSON body `detail.status: "quota_exceeded"` (not invalid key). */
function isElevenLabsQuotaErrorBody(errText: string): boolean {
  const t = errText.trim();
  if (!t) return false;
  if (/quota_exceeded/i.test(t)) return true;
  try {
    const j = JSON.parse(t) as { detail?: { status?: string; message?: string } };
    if (j?.detail?.status === "quota_exceeded") return true;
  } catch {
    /* not JSON */
  }
  return false;
}

/**
 * Single-chunk TTS with one automatic retry on transient failures (429 / 5xx).
 * Designed for paragraph-level calls where rate-limit back-off matters.
 */
export async function generateElevenLabsTtsChunk(
  apiKey: string,
  opts: ElevenLabsTtsOptions,
): Promise<ElevenLabsTtsResult> {
  const first = await generateElevenLabsTts(apiKey, opts);
  if (first.ok) return first;
  const retryable =
    (first.code === "elevenlabs_api_error" || first.code === "elevenlabs_quota_exceeded") &&
    first.message &&
    /^(429|5\d\d):/.test(first.message);
  if (retryable) {
    await new Promise((r) => setTimeout(r, 2000));
    return generateElevenLabsTts(apiKey, opts);
  }
  return first;
}

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
          ...(opts.style != null && Number.isFinite(opts.style)
            ? { style: opts.style }
            : {}),
          ...(opts.useSpeakerBoost != null
            ? { use_speaker_boost: opts.useSpeakerBoost }
            : {}),
        },
        ...(opts.language ? { language_code: opts.language } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const message = `${res.status}: ${errText.slice(0, 500)}`;
      if (isElevenLabsQuotaErrorBody(errText)) {
        return { ok: false, code: "elevenlabs_quota_exceeded", message };
      }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, code: "elevenlabs_auth_error", message };
      }
      if (res.status === 402) {
        return { ok: false, code: "elevenlabs_quota_exceeded", message };
      }
      return {
        ok: false,
        code: "elevenlabs_api_error",
        message,
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
      message:
        err instanceof Error
          ? err.message.slice(0, 400)
          : "Unknown error",
    };
  } finally {
    clearTimeout(tid);
  }
}
