import { verifyElevenLabsApiKey } from "@/lib/studio-integrations/elevenlabs-verify";
import type {
  ProviderRunStepResult,
  StudioProviderAdapter,
} from "@/lib/studio-integrations/providers/types";
import { generateElevenLabsTts } from "./elevenlabs-tts";

/**
 * ElevenLabs TTS adapter: health via /v1/user; TTS generation via runStep.
 * runStep returns audio as base64 in output_urls[0] (data URI) for artifact storage.
 */
export const elevenlabsAdapter: StudioProviderAdapter = {
  id: "elevenlabs",

  async healthCheck(secret: string) {
    const r = await verifyElevenLabsApiKey(secret);
    if (r.ok) return { ok: true };
    return { ok: false, status: r.status };
  },

  async runStep(secret: string, args: Record<string, unknown>): Promise<ProviderRunStepResult> {
    const text = typeof args.text === "string" ? args.text : "";
    if (!text.trim()) {
      return { ok: false, code: "elevenlabs_empty_text" };
    }

    const voiceId = typeof args.voice_id === "string" ? args.voice_id : undefined;
    const language = typeof args.language === "string" ? args.language : undefined;

    const r = await generateElevenLabsTts(secret, {
      text,
      voiceId,
      language,
    });

    if (!r.ok) {
      return { ok: false, code: r.code, message: r.message };
    }

    const base64 = Buffer.from(r.audioBuffer).toString("base64");
    const dataUri = `data:${r.contentType};base64,${base64}`;

    return {
      ok: true,
      task_id: `elevenlabs-tts-${Date.now()}`,
      output_urls: [dataUri],
    };
  },
};
