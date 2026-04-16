"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";
import { generateElevenLabsTts } from "@/lib/studio-integrations/providers/elevenlabs/elevenlabs-tts";
import {
  runChunkedTts,
  type TtsSegment,
} from "@/lib/studio-productions/tts-chunked-pipeline";
import { resolveVoiceIdFromPreset } from "@/lib/studio-productions/elevenlabs-tts-presets";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

/** Safe snippet for UI (no newlines spam; max length). */
function sanitizeProviderErrorDetail(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const s = raw.replace(/\s+/g, " ").trim().slice(0, 400);
  return s || undefined;
}

function parseUnitInterval(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(1, Math.max(0, n));
}

function parseSpeakerBoost(
  formData: FormData,
): boolean | undefined {
  const v = String(formData.get("tts_speaker_boost") ?? "").trim();
  if (v === "") return undefined;
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return undefined;
}

function mapElevenLabsProviderCode(code: string): (typeof ActionErrorCode)[keyof typeof ActionErrorCode] {
  switch (code) {
    case "elevenlabs_api_error":
      return ActionErrorCode.studioTtsElevenLabsApiError;
    case "elevenlabs_auth_error":
      return ActionErrorCode.studioTtsElevenLabsAuthError;
    case "elevenlabs_quota_exceeded":
      return ActionErrorCode.studioTtsElevenLabsQuotaError;
    case "elevenlabs_empty_text":
      return ActionErrorCode.studioTtsElevenLabsEmptyText;
    case "elevenlabs_timeout":
      return ActionErrorCode.studioTtsElevenLabsTimeout;
    default:
      return ActionErrorCode.studioTtsElevenLabsApiError;
  }
}

export type StudioTtsActionState = {
  ok?: boolean;
  error?: string;
  /** Provider HTTP status + body snippet (e.g. ElevenLabs) for debugging. */
  errorDetail?: string;
  artifactId?: string;
};

/**
 * Generate TTS audio from episode script text via ElevenLabs.
 * When a `timed_script` artifact exists, uses paragraph-level chunked TTS
 * for precise segment timestamps; otherwise falls back to single-call mode.
 */
export async function generateTtsFromScript(
  _prev: StudioTtsActionState | null,
  formData: FormData,
): Promise<StudioTtsActionState> {
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!episodeId) return { error: ActionErrorCode.unexpected };

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const scriptText = String(formData.get("script_text") ?? "").trim();
  if (!scriptText) return { error: ActionErrorCode.studioTtsEmptyScript };

  const voicePreset = String(formData.get("voice_preset") ?? "female").trim();
  const customVoiceId = String(formData.get("voice_id") ?? "").trim() || undefined;
  const resolvedVoice = resolveVoiceIdFromPreset(voicePreset, customVoiceId);
  if (resolvedVoice.error === "custom_voice_required") {
    return { error: ActionErrorCode.studioTtsCustomVoiceIdRequired };
  }
  const voiceId = resolvedVoice.voiceId;

  const language = String(formData.get("language") ?? "").trim() || undefined;
  const modelId = String(formData.get("model_id") ?? "").trim() || undefined;

  const stability = parseUnitInterval(String(formData.get("tts_stability") ?? ""));
  const similarityBoost = parseUnitInterval(String(formData.get("tts_similarity") ?? ""));
  const styleRaw = String(formData.get("tts_style") ?? "").trim();
  const style = styleRaw === "" ? undefined : parseUnitInterval(styleRaw);
  const useSpeakerBoost = parseSpeakerBoost(formData);

  const apiKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    "elevenlabs",
  );
  if (!apiKey) return { error: ActionErrorCode.studioTtsNoElevenLabsKey };

  const { data: timedRows } = await supabase
    .from("studio_production_artifacts")
    .select("content_text")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "timed_script")
    .order("created_at", { ascending: false })
    .limit(1);

  const hasTimedScript = Boolean(timedRows?.[0]?.content_text?.trim());

  let audioBuffer: ArrayBuffer;
  let contentType: string;
  let segments: TtsSegment[] | undefined;
  let totalDurationMs: number | undefined;

  const ttsVoiceOpts = {
    voiceId,
    language,
    modelId,
    stability,
    similarityBoost,
    style,
    useSpeakerBoost,
  };

  if (hasTimedScript) {
    const chunked = await runChunkedTts(apiKey, scriptText, ttsVoiceOpts);
    if (!chunked.ok) {
      const segHint =
        chunked.failedIndex != null
          ? ` (paragraph ${chunked.failedIndex + 1})`
          : "";
      return {
        error: mapElevenLabsProviderCode(chunked.code),
        errorDetail: sanitizeProviderErrorDetail(
          [chunked.message, segHint].filter(Boolean).join("") || undefined,
        ),
      };
    }
    audioBuffer = chunked.audioBuffer;
    contentType = chunked.contentType;
    segments = chunked.segments;
    totalDurationMs = chunked.totalDurationMs;
  } else {
    const result = await generateElevenLabsTts(apiKey, {
      text: scriptText,
      ...ttsVoiceOpts,
    });
    if (!result.ok) {
      return {
        error: mapElevenLabsProviderCode(result.code),
        errorDetail: sanitizeProviderErrorDetail(result.message),
      };
    }
    audioBuffer = result.audioBuffer;
    contentType = result.contentType;
  }

  const base64Audio = Buffer.from(audioBuffer).toString("base64");
  const dataUri = `data:${contentType};base64,${base64Audio}`;

  const metadata: Record<string, Json> = {
    source: "elevenlabs",
    mode: segments ? "chunked" : "single",
    voice_preset: voicePreset,
    voice_id: voiceId ?? "default",
    model_id: modelId ?? "eleven_multilingual_v3",
    language: language ?? "auto",
    ...(stability != null ? { tts_stability: stability } : {}),
    ...(similarityBoost != null ? { tts_similarity_boost: similarityBoost } : {}),
    ...(style != null ? { tts_style: style } : {}),
    ...(useSpeakerBoost != null ? { tts_speaker_boost: useSpeakerBoost } : {}),
    content_type: contentType,
    byte_size: audioBuffer.byteLength,
    ...(segments ? { chunk_count: segments.length } : {}),
    ...(segments
      ? {
          segments: segments.map((s) => ({
            i: s.index,
            t: s.text.slice(0, 200),
            s: s.startMs,
            e: s.endMs,
          })),
        }
      : {}),
    ...(totalDurationMs != null ? { total_duration_ms: totalDurationMs } : {}),
    generated_at: new Date().toISOString(),
  };

  const contentText = segments
    ? segments
        .map((s) => {
          const mm = Math.floor(s.startMs / 60000);
          const ss = Math.floor((s.startMs % 60000) / 1000);
          const ms = s.startMs % 1000;
          return `[${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ms).padStart(3, "0")}] ${s.text}`;
        })
        .join("\n\n")
    : scriptText.slice(0, 500);

  const { data: artifact, error: insertErr } = await supabase
    .from("studio_production_artifacts")
    .insert({
      episode_id: episodeId,
      organization_id: auth.ctx.organizationId,
      artifact_role: "tts_audio",
      tool_platform: "elevenlabs",
      content_text: contentText,
      external_url: dataUri,
      metadata,
    })
    .select("id")
    .single();

  if (insertErr || !artifact) return { error: ActionErrorCode.studioTtsInsertFailed };

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_TTS_GENERATE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { mode: segments ? "chunked" : "single", chunk_count: segments?.length ?? 1 },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: artifact.id };
}

/**
 * Generate subtitles from TTS audio.
 * - If the TTS artifact has segment timestamps (chunked mode), generates WebVTT directly (no Whisper cost).
 * - Otherwise falls back to OpenAI Whisper STT → SRT.
 */
export async function generateSubtitlesFromAudio(
  _prev: StudioTtsActionState | null,
  formData: FormData,
): Promise<StudioTtsActionState> {
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const audioUrl = String(formData.get("audio_url") ?? "").trim();
  if (!episodeId || !audioUrl) return { error: ActionErrorCode.unexpected };

  const { data: ttsRows } = await supabase
    .from("studio_production_artifacts")
    .select("metadata")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "tts_audio")
    .order("created_at", { ascending: false })
    .limit(1);

  const ttsMetadata = ttsRows?.[0]?.metadata as Record<string, unknown> | null;
  const savedSegments = ttsMetadata?.segments as
    | Array<{ i: number; t: string; s: number; e: number }>
    | undefined;

  if (savedSegments && savedSegments.length > 0) {
    const { segmentsToWebVtt } = await import(
      "@/lib/studio-productions/subtitle-formatter"
    );
    const fullSegments: TtsSegment[] = savedSegments.map((s) => ({
      index: s.i,
      text: s.t,
      startMs: s.s,
      endMs: s.e,
    }));
    const vttContent = segmentsToWebVtt(fullSegments);

    const metadata: Record<string, Json> = {
      source: "tts_segments",
      format: "webvtt",
      segment_count: fullSegments.length,
      generated_at: new Date().toISOString(),
    };

    const { data: artifact, error: insertErr } = await supabase
      .from("studio_production_artifacts")
      .insert({
        episode_id: episodeId,
        organization_id: auth.ctx.organizationId,
        artifact_role: "subtitle_srt",
        tool_platform: "elevenlabs_segments",
        content_text: vttContent,
        metadata,
      })
      .select("id")
      .single();

    if (insertErr || !artifact) return { error: ActionErrorCode.studioSubtitleInsertFailed };

    void logAudit({
      organizationId: auth.ctx.organizationId,
      actorId: auth.ctx.userId,
      action: AuditAction.STUDIO_SUBTITLE_GENERATE,
      entityType: AuditEntityType.STUDIO_EPISODE,
      entityId: episodeId,
      metadata: { source: "tts_segments", format: "webvtt" },
    });

    revalidatePath(`/dashboard/productions/${episodeId}`);
    return { ok: true, artifactId: artifact.id };
  }

  const openaiKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    "openai",
  );
  if (!openaiKey) return { error: ActionErrorCode.studioSubtitleNoOpenAiKey };

  let audioBuffer: ArrayBuffer;
  if (audioUrl.startsWith("data:")) {
    const base64Part = audioUrl.split(",")[1];
    if (!base64Part) return { error: ActionErrorCode.unexpected };
    audioBuffer = Buffer.from(base64Part, "base64").buffer;
  } else {
    const res = await fetch(audioUrl);
    if (!res.ok) return { error: ActionErrorCode.studioSubtitleAudioFetchFailed };
    audioBuffer = await res.arrayBuffer();
  }

  const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const whisperForm = new FormData();
  whisperForm.append("file", audioBlob, "audio.mp3");
  whisperForm.append("model", "whisper-1");
  whisperForm.append("response_format", "srt");

  const whisperRes = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey.trim()}` },
      body: whisperForm,
    },
  );

  if (!whisperRes.ok) return { error: ActionErrorCode.studioSubtitleWhisperError };

  const srtContent = await whisperRes.text();

  const metadata: Record<string, Json> = {
    source: "whisper",
    model: "whisper-1",
    format: "srt",
    generated_at: new Date().toISOString(),
  };

  const { data: artifact, error: insertErr } = await supabase
    .from("studio_production_artifacts")
    .insert({
      episode_id: episodeId,
      organization_id: auth.ctx.organizationId,
      artifact_role: "subtitle_srt",
      tool_platform: "openai_whisper",
      content_text: srtContent,
      metadata,
    })
    .select("id")
    .single();

  if (insertErr || !artifact) return { error: ActionErrorCode.studioSubtitleInsertFailed };

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SUBTITLE_GENERATE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { source: "whisper", format: "srt" },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: artifact.id };
}
