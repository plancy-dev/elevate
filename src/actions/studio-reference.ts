"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import {
  extractTranscriptFromYouTube,
  wrapTextAsTranscript,
  wrapManualNoteAsTranscript,
  buildReferenceAdaptPrompt,
  type ExtractedTranscript,
  type ReferenceSourceType,
  type ScriptAdaptationMode,
} from "@/lib/studio-productions/reference-source";
import { STUDIO_CONTENT_TEXT_MAX } from "@/lib/studio-productions/constants";
import {
  extractUrlContent,
  formatUrlExtractAsReferenceText,
  UrlNotAllowedError,
} from "@/lib/url-extract";

export type ReferenceActionState = {
  ok?: boolean;
  error?: string;
  transcript?: string;
} | null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isYouTubeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "youtu.be" ||
    h === "www.youtube.com" ||
    h === "youtube.com" ||
    h === "m.youtube.com" ||
    h.endsWith(".youtube.com")
  );
}

function parseSourceType(raw: string): ReferenceSourceType | null {
  const t = raw.trim();
  if (
    t === "youtube_url" ||
    t === "web_url" ||
    t === "text" ||
    t === "manual_note"
  ) {
    return t;
  }
  return null;
}

async function insertReferenceSourceRow(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    episodeId: string;
    contentText: string;
    toolPlatform: string;
    sourceType: ReferenceSourceType;
    sourceLabel: string;
    language: string;
    extraMetadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  const { error } = await supabase.from("studio_production_artifacts").insert({
    organization_id: params.organizationId,
    episode_id: params.episodeId,
    artifact_role: "reference_source",
    content_text: params.contentText,
    tool_platform: params.toolPlatform,
    metadata: {
      source_type: params.sourceType,
      source_label: params.sourceLabel,
      language: params.language,
      ...params.extraMetadata,
    },
  });
  return !error;
}

/**
 * Extract transcript from YouTube, open web URL, text, or manual note — save as reference_source artifact.
 */
export async function extractReferenceTranscript(
  _prev: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  void _prev;
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
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

  const sourceType =
    parseSourceType(String(formData.get("source_type") ?? "")) ?? "text";
  const sourceValue = String(formData.get("source_value") ?? "").trim();
  const sourceLabel = String(formData.get("source_label") ?? "").trim();

  if (!sourceValue && sourceType !== "text" && sourceType !== "manual_note") {
    return { error: ActionErrorCode.unexpected };
  }
  if (
    (sourceType === "text" || sourceType === "manual_note") &&
    !sourceValue
  ) {
    return { error: ActionErrorCode.studioReferenceNoteEmpty };
  }
  if (sourceValue.length > STUDIO_CONTENT_TEXT_MAX) {
    return { error: ActionErrorCode.studioTextTooLong };
  }

  let extracted: ExtractedTranscript | null = null;

  if (sourceType === "youtube_url") {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return { error: ActionErrorCode.studioReferenceNoApiKey };

    let yt = await extractTranscriptFromYouTube(sourceValue, openaiKey);
    if (!yt.ok && yt.code !== "tool_missing") {
      await delay(900);
      yt = await extractTranscriptFromYouTube(sourceValue, openaiKey);
    }

    if (!yt.ok) {
      if (yt.code === "tool_missing") {
        return { error: ActionErrorCode.studioReferenceYoutubeToolMissing };
      }
      return { error: ActionErrorCode.studioReferenceExtractionFailed };
    }
    extracted = yt.transcript;
  } else if (sourceType === "web_url") {
    let urlObj: URL;
    try {
      urlObj = new URL(sourceValue);
    } catch {
      return { error: ActionErrorCode.studioReferenceUrlInvalid };
    }
    if (isYouTubeHost(urlObj.hostname)) {
      return { error: ActionErrorCode.studioReferenceUseYoutubeTab };
    }
    try {
      const result = await extractUrlContent(sourceValue);
      const text = formatUrlExtractAsReferenceText(result.url, result);
      const sourceLabelResolved = result.meta.title?.trim() || result.url;
      const ok = await insertReferenceSourceRow(supabase, {
        organizationId: auth.ctx.organizationId,
        episodeId,
        contentText: text,
        toolPlatform: "web_extract",
        sourceType: "web_url",
        sourceLabel: sourceLabelResolved,
        language: "auto",
        extraMetadata: {
          canonical_url: result.url,
          extract_method: result.extractMethod,
          body_truncated: result.bodyTruncated,
          fetch_duration_ms: result.fetchDurationMs,
          og_title: result.meta.title,
          og_description: result.meta.description,
          og_image: result.meta.image,
          og_site_name: result.meta.siteName,
        },
      });
      if (!ok) return { error: ActionErrorCode.unexpected };
      revalidatePath(`/dashboard/productions/${episodeId}`);
      return { ok: true, transcript: text };
    } catch (e) {
      if (e instanceof UrlNotAllowedError) {
        return { error: ActionErrorCode.studioReferenceUrlBlocked };
      }
      return { error: ActionErrorCode.studioReferenceFetchFailed };
    }
  } else if (sourceType === "manual_note") {
    extracted = wrapManualNoteAsTranscript(sourceValue, sourceLabel);
  } else {
    extracted = wrapTextAsTranscript(sourceValue, sourceLabel);
  }

  if (!extracted) return { error: ActionErrorCode.studioReferenceExtractionFailed };

  const toolPlatform =
    extracted.sourceType === "youtube_url"
      ? "youtube"
      : extracted.sourceType === "manual_note"
        ? "manual_note"
        : "manual";

  const ok = await insertReferenceSourceRow(supabase, {
    organizationId: auth.ctx.organizationId,
    episodeId,
    contentText: extracted.transcript,
    toolPlatform,
    sourceType: extracted.sourceType,
    sourceLabel: extracted.sourceLabel,
    language: extracted.language,
  });

  if (!ok) return { error: ActionErrorCode.unexpected };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, transcript: extracted.transcript };
}

/**
 * Remove a single reference_source row (only that role; scoped to episode + org).
 */
export async function deleteStudioReferenceSource(
  _prev: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  void _prev;
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  if (!episodeId || !artifactId) return { error: ActionErrorCode.unexpected };

  const { data, error } = await supabase
    .from("studio_production_artifacts")
    .delete()
    .eq("id", artifactId)
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "reference_source")
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!data?.length) return { error: ActionErrorCode.studioArtifactNotFound };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true };
}

/**
 * Adapt reference transcripts into a structured script using LLM.
 */
export async function adaptReferencesToScript(
  _prev: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  void _prev;
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
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

  const mode = String(formData.get("mode") ?? "translate") as ScriptAdaptationMode;
  const targetLanguage = String(formData.get("target_language") ?? "Korean").trim();
  const additionalInstructions = String(formData.get("instructions") ?? "").trim();

  const { data: refArtifacts } = await supabase
    .from("studio_production_artifacts")
    .select("content_text, metadata, artifact_role")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "reference_source")
    .order("created_at", { ascending: true });

  if (!refArtifacts || refArtifacts.length === 0) {
    return { error: ActionErrorCode.studioReferenceNoSources };
  }

  const allowedTypes: ReferenceSourceType[] = [
    "youtube_url",
    "web_url",
    "text",
    "manual_note",
  ];

  const transcripts: ExtractedTranscript[] = refArtifacts.map((a) => {
    const meta = (a.metadata ?? {}) as Record<string, unknown>;
    const raw = meta.source_type;
    const st =
      typeof raw === "string" && allowedTypes.includes(raw as ReferenceSourceType)
        ? (raw as ReferenceSourceType)
        : "text";
    const label =
      typeof meta.source_label === "string" ? meta.source_label : "unknown";
    return {
      sourceType: st,
      sourceLabel: label,
      language: typeof meta.language === "string" ? meta.language : "auto",
      transcript: a.content_text ?? "",
    };
  });

  const prompt = buildReferenceAdaptPrompt(
    transcripts,
    mode,
    targetLanguage,
    additionalInstructions || undefined,
  );

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return { error: ActionErrorCode.studioReferenceNoApiKey };

  const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert content writer. Respond only with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!llmRes.ok) return { error: ActionErrorCode.studioReferenceLlmFailed };

  const llmData = await llmRes.json();
  const rawContent = llmData.choices?.[0]?.message?.content ?? "";

  let parsed: { hook?: string; title?: string; script_draft?: string };
  try {
    const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { error: ActionErrorCode.studioReferenceLlmParseFailed };
  }

  const hook = parsed.hook ?? "";
  const title = parsed.title ?? "";
  const scriptDraft = parsed.script_draft ?? "";

  const artifactUpdates = [
    { role: "hook", text: hook },
    { role: "title_suggestion", text: title },
    { role: "script_draft", text: scriptDraft },
  ];

  for (const { role, text } of artifactUpdates) {
    if (!text) continue;
    await supabase.from("studio_production_artifacts").insert({
      organization_id: auth.ctx.organizationId,
      episode_id: episodeId,
      artifact_role: role,
      content_text: text,
      tool_platform: "llm_adapt",
      metadata: {
        adaptation_mode: mode,
        target_language: targetLanguage,
        source_count: transcripts.length,
      },
    });
  }

  if (title) {
    await supabase
      .from("studio_production_episodes")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", episodeId);
  }

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true };
}
