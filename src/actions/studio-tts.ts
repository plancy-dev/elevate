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
import type { Json } from "@/types/database.types";

export type StudioTtsActionState = {
  ok?: boolean;
  error?: string;
  artifactId?: string;
};

/**
 * Generate TTS audio from episode script text via ElevenLabs.
 * Stores the result as a `tts_audio` artifact on the episode.
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
  if (!scriptText) return { error: "studioTtsEmptyScript" };

  const voiceId = String(formData.get("voice_id") ?? "").trim() || undefined;
  const language = String(formData.get("language") ?? "").trim() || undefined;

  const apiKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    "elevenlabs",
  );
  if (!apiKey) return { error: "studioTtsNoElevenLabsKey" };

  const result = await generateElevenLabsTts(apiKey, {
    text: scriptText,
    voiceId,
    language,
  });

  if (!result.ok) return { error: result.code };

  const base64Audio = Buffer.from(result.audioBuffer).toString("base64");
  const dataUri = `data:${result.contentType};base64,${base64Audio}`;

  const metadata: Record<string, Json> = {
    source: "elevenlabs",
    voice_id: voiceId ?? "default",
    language: language ?? "auto",
    content_type: result.contentType,
    byte_size: result.audioBuffer.byteLength,
    generated_at: new Date().toISOString(),
  };

  const { data: artifact, error: insertErr } = await supabase
    .from("studio_production_artifacts")
    .insert({
      episode_id: episodeId,
      organization_id: auth.ctx.organizationId,
      artifact_role: "tts_audio",
      tool_platform: "elevenlabs",
      content_text: scriptText.slice(0, 500),
      external_url: dataUri,
      metadata,
    })
    .select("id")
    .single();

  if (insertErr || !artifact) return { error: "studioTtsInsertFailed" };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: artifact.id };
}

/**
 * Generate SRT subtitles from TTS audio using OpenAI Whisper API.
 * Requires the org to have an OpenAI API key connected.
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

  const openaiKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    "openai",
  );
  if (!openaiKey) return { error: "studioSubtitleNoOpenAiKey" };

  let audioBuffer: ArrayBuffer;
  if (audioUrl.startsWith("data:")) {
    const base64Part = audioUrl.split(",")[1];
    if (!base64Part) return { error: ActionErrorCode.unexpected };
    audioBuffer = Buffer.from(base64Part, "base64").buffer;
  } else {
    const res = await fetch(audioUrl);
    if (!res.ok) return { error: "studioSubtitleAudioFetchFailed" };
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

  if (!whisperRes.ok) return { error: "studioSubtitleWhisperError" };

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

  if (insertErr || !artifact) return { error: "studioSubtitleInsertFailed" };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: artifact.id };
}
