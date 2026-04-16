/**
 * Paragraph-level chunked TTS pipeline.
 *
 * Splits the script into timed blocks (reusing splitScriptIntoTimedBlocks),
 * calls ElevenLabs per paragraph, concatenates MP3 audio buffers,
 * and returns precise segment timestamps derived from actual audio byte lengths.
 *
 * Silence gaps are reflected only in timestamp math (not raw bytes),
 * because injecting non-MP3 bytes into an MP3 stream corrupts playback.
 */
import {
  generateElevenLabsTtsChunk,
  type ElevenLabsTtsOptions,
} from "@/lib/studio-integrations/providers/elevenlabs/elevenlabs-tts";
import { splitScriptIntoTimedBlocks } from "@/lib/studio-productions/timed-script";

export type TtsSegment = {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
};

export type ChunkedTtsResult =
  | {
      ok: true;
      audioBuffer: ArrayBuffer;
      contentType: string;
      segments: TtsSegment[];
      totalDurationMs: number;
    }
  | { ok: false; code: string; message?: string; failedIndex?: number };

/** Virtual silence gap between paragraphs (ms) for timestamp spacing. */
const SILENCE_GAP_MS = 300;

/**
 * MP3 CBR bitrate assumption (ElevenLabs default: 128 kbps MP3).
 * Used to estimate duration from byte length when no header is available.
 */
const MP3_BITRATE_KBPS = 128;

function estimateDurationMs(byteLength: number): number {
  return Math.round((byteLength * 8) / (MP3_BITRATE_KBPS * 1000) * 1000);
}

function concatBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return result.buffer;
}

/**
 * Run chunked TTS for a script.
 * Each paragraph is sent to ElevenLabs individually; results are concatenated.
 * Timestamps include a virtual silence gap between paragraphs for subtitle spacing.
 */
export async function runChunkedTts(
  apiKey: string,
  scriptText: string,
  opts?: Pick<
    ElevenLabsTtsOptions,
    | "voiceId"
    | "modelId"
    | "language"
    | "stability"
    | "similarityBoost"
    | "style"
    | "useSpeakerBoost"
  >,
): Promise<ChunkedTtsResult> {
  const blocks = splitScriptIntoTimedBlocks(scriptText);
  if (blocks.length === 0) {
    return { ok: false, code: "elevenlabs_empty_text" };
  }

  const audioChunks: ArrayBuffer[] = [];
  const segments: TtsSegment[] = [];
  let elapsedMs = 0;

  for (let i = 0; i < blocks.length; i++) {
    const text = blocks[i];

    const result = await generateElevenLabsTtsChunk(apiKey, {
      text,
      voiceId: opts?.voiceId,
      modelId: opts?.modelId,
      language: opts?.language,
      stability: opts?.stability,
      similarityBoost: opts?.similarityBoost,
      style: opts?.style,
      useSpeakerBoost: opts?.useSpeakerBoost,
    });

    if (!result.ok) {
      return { ok: false, code: result.code, message: result.message, failedIndex: i };
    }

    const chunkDurationMs = estimateDurationMs(result.audioBuffer.byteLength);
    const startMs = elapsedMs;
    const endMs = elapsedMs + chunkDurationMs;

    segments.push({ index: i, text, startMs, endMs });
    audioChunks.push(result.audioBuffer);

    elapsedMs = endMs;

    if (i < blocks.length - 1) {
      elapsedMs += SILENCE_GAP_MS;
    }
  }

  return {
    ok: true,
    audioBuffer: concatBuffers(audioChunks),
    contentType: "audio/mpeg",
    segments,
    totalDurationMs: elapsedMs,
  };
}
