"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import {
  getOrgLlmCredentialForProvider,
  getOrgLlmProviderAvailability,
  type OrgLlmCredential,
} from "@/lib/studio-productions/episode-llm";
import {
  DEFAULT_PACKAGING_DRAFT_MODEL_ID,
  isAllowedDraftModel,
  resolveDraftModel,
} from "@/lib/studio-productions/episode-llm-models";
import { parsePackagingDraftContent } from "@/lib/studio-productions/packaging-draft";
import { draftTripleFromArtifactTimestamps } from "@/lib/studio-productions/resolve-episode-draft-artifacts";
import { buildTimedScriptFromPlainScript } from "@/lib/studio-productions/timed-script";
import { resolveEpisodeFormat } from "@/lib/studio-productions/episode-format";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

export type StudioPipelinePrestepState = {
  ok?: boolean;
  error?: string;
} | null;

async function upsertLatestArtifact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
  artifactRole: string,
  contentText: string,
  toolPlatform: string,
  metadata: Record<string, Json>,
  options?: { external_url?: string | null },
): Promise<{ ok: true } | { ok: false }> {
  const { data: row } = await supabase
    .from("studio_production_artifacts")
    .select("id")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .eq("artifact_role", artifactRole)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (row?.id) {
    const { error } = await supabase
      .from("studio_production_artifacts")
      .update({
        content_text: contentText,
        metadata: metadata as Json,
        tool_platform: toolPlatform,
        ...(options && "external_url" in options
          ? { external_url: options.external_url ?? null }
          : {}),
      })
      .eq("id", row.id);
    if (error) return { ok: false };
    return { ok: true };
  }

  const { error } = await supabase.from("studio_production_artifacts").insert({
    organization_id: organizationId,
    episode_id: episodeId,
    artifact_role: artifactRole,
    tool_platform: toolPlatform,
    content_text: contentText,
    metadata: metadata as Json,
    sort_order: 50,
    external_url: options?.external_url ?? null,
  });
  if (error) return { ok: false };
  return { ok: true };
}

/**
 * Build a [mm:ss] segmented script from the episode script_draft artifact (heuristic).
 */
export async function generateTimedScriptFromEpisode(
  _prev: StudioPipelinePrestepState,
  formData: FormData,
): Promise<StudioPipelinePrestepState> {
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

  const { data: artifactRows, error: artErr } = await supabase
    .from("studio_production_artifacts")
    .select("artifact_role, content_text, created_at")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .in("artifact_role", ["hook", "title", "script_draft", "script"]);

  if (artErr) return { error: ActionErrorCode.dbError };

  const triple = draftTripleFromArtifactTimestamps(artifactRows ?? []);
  const fromTriple = triple.script_draft.trim();
  const latestScriptArtifact = (artifactRows ?? [])
    .filter((r) => r.artifact_role === "script")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  const fromScriptRole = (latestScriptArtifact?.content_text ?? "").trim();
  const scriptText = fromTriple || fromScriptRole;
  if (!scriptText) return { error: ActionErrorCode.studioPipelineNeedScript };

  const timed = buildTimedScriptFromPlainScript(scriptText);
  if (!timed) return { error: ActionErrorCode.studioPipelineNeedScript };

  const meta: Record<string, Json> = {
    source: "heuristic_timestamps",
    generated_at: new Date().toISOString(),
  };

  const up = await upsertLatestArtifact(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    "timed_script",
    timed,
    "elevate",
    meta,
  );
  if (!up.ok) return { error: ActionErrorCode.dbError };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true };
}

/**
 * LLM: YouTube title, description, and thumbnail *prompt* (not rendered image).
 */
export async function generatePackagingDraftFromEpisode(
  _prev: StudioPipelinePrestepState,
  formData: FormData,
): Promise<StudioPipelinePrestepState> {
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

  const { data: artRows, error: artErr } = await supabase
    .from("studio_production_artifacts")
    .select("artifact_role, content_text, created_at")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .in("artifact_role", ["hook", "title", "script_draft", "script"]);

  if (artErr) return { error: ActionErrorCode.dbError };

  const triple = draftTripleFromArtifactTimestamps(artRows ?? []);
  const latestScriptArtifact = (artRows ?? [])
    .filter((r) => r.artifact_role === "script")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  const scriptFromScriptRole = (latestScriptArtifact?.content_text ?? "").trim();
  const script = (triple.script_draft.trim() || scriptFromScriptRole).trim();
  if (!script) return { error: ActionErrorCode.studioPipelineNeedScript };

  const customInstructions = String(formData.get("custom_instructions") ?? "").trim();
  const modelOverrideRaw = String(formData.get("model") ?? "").trim();
  const modelOverride = modelOverrideRaw || null;

  const availability = await getOrgLlmProviderAvailability(
    supabase,
    auth.ctx.organizationId,
  );

  const requestedModel = modelOverride ?? DEFAULT_PACKAGING_DRAFT_MODEL_ID;

  let cred: OrgLlmCredential | null = null;
  let model: string;

  if (isAllowedDraftModel("anthropic", requestedModel) && availability.anthropic) {
    cred = await getOrgLlmCredentialForProvider(
      supabase,
      auth.ctx.organizationId,
      "anthropic",
    );
    model = resolveDraftModel("anthropic", requestedModel);
  } else if (isAllowedDraftModel("openai", requestedModel) && availability.openai) {
    cred = await getOrgLlmCredentialForProvider(
      supabase,
      auth.ctx.organizationId,
      "openai",
    );
    model = resolveDraftModel("openai", requestedModel);
  } else if (availability.anthropic) {
    cred = await getOrgLlmCredentialForProvider(
      supabase,
      auth.ctx.organizationId,
      "anthropic",
    );
    model = resolveDraftModel("anthropic", requestedModel);
  } else if (availability.openai) {
    cred = await getOrgLlmCredentialForProvider(
      supabase,
      auth.ctx.organizationId,
      "openai",
    );
    model = resolveDraftModel("openai", requestedModel);
  } else {
    return { error: ActionErrorCode.studioLlmNoProvider };
  }

  if (!cred) return { error: ActionErrorCode.studioLlmNoProvider };

  const format = resolveEpisodeFormat(episode);
  const formatLabel = format === "shorts" ? "short-form vertical" : "long-form horizontal";

  const userMsg = [
    `Given the following ${formatLabel} video draft, propose packaging for YouTube.`,
    "Return JSON only with keys: youtube_title, youtube_description, thumbnail_image_prompt.",
    "",
    "## youtube_title rules",
    "- ≤60 characters so it is fully visible on mobile feeds.",
    "- Front-load the most important keyword or hook phrase.",
    "- Do NOT use ALL-CAPS for the entire title; capitalize only 1-2 key words for emphasis.",
    "- Never promise content that is not in the script (YouTube policy: misleading metadata → strike).",
    "- Avoid clickbait patterns: fake urgency, fabricated news events, celebrity bait for unrelated content.",
    "",
    "## youtube_description rules",
    "- 2–4 lines. First line repeats or paraphrases the hook (shown in search snippets).",
    "- Include 2-3 relevant keywords naturally. No keyword-stuffing.",
    "- No misleading statements about what is in the video.",
    "",
    "## thumbnail_image_prompt rules",
    "- English visual description for an image generation model (DALL-E 3, 1792×1024 landscape).",
    "- MUST NOT include any text, letters, numbers, watermarks, or logos — text will be overlaid separately.",
    "- MUST NOT depict real celebrities, copyrighted characters, or branded logos.",
    "- MUST NOT depict violence, sexually suggestive content, or shocking/disturbing imagery.",
    "- Describe a single clear subject with high-contrast, warm/saturated colors, simple background.",
    "- Prefer cinematic/photographic style over cartoon/illustration to reduce generic AI look.",
    "- The image must read clearly even at 168×94 px (YouTube sidebar thumbnail size).",
    ...(customInstructions
      ? ["", "## Additional user instructions", customInstructions]
      : []),
    "",
    `hook: ${triple.hook}`,
    `working_title: ${triple.title}`,
    `script:\n${script.slice(0, 12000)}`,
  ].join("\n");

  const system = [
    "You are a YouTube packaging expert. Output valid JSON only.",
    "Your packaging must comply with YouTube Community Guidelines and advertiser-friendly content policies.",
    "Never generate metadata that could be considered misleading, clickbait, or policy-violating.",
  ].join(" ");

  let rawText = "";

  if (cred.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) return { error: ActionErrorCode.studioLlmRequestFailed };
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    rawText = body.choices?.[0]?.message?.content ?? "";
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cred.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return { error: ActionErrorCode.studioLlmRequestFailed };
    const body = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    rawText = body.content?.find((c) => c.type === "text")?.text ?? "";
  }

  const parsed = parsePackagingDraftContent(rawText);
  if (!parsed) return { error: ActionErrorCode.studioLlmBadResponse };

  const contentText = JSON.stringify(parsed, null, 2);
  const meta: Record<string, Json> = {
    source: "llm_packaging",
    model,
    provider: cred.provider,
    generated_at: new Date().toISOString(),
  };

  const up = await upsertLatestArtifact(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    "packaging_draft",
    contentText,
    cred.provider,
    meta,
  );
  if (!up.ok) return { error: ActionErrorCode.dbError };

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_PACKAGING_GENERATE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { model, provider: cred.provider },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true };
}

/**
 * YouTube thumbnail compliance prefix — prepended to every user-facing thumbnail prompt.
 * Based on YouTube Help (support.google.com/youtube/answer/72431) and Community Guidelines.
 *
 * Spec: 1280x720 (16:9) standard; DALL-E closest = 1792x1024 (~1.75:1).
 * File: JPG ≤2 MB (mobile), up to 50 MB (desktop 4K); sRGB.
 */
const THUMBNAIL_COMPLIANCE_PREFIX = [
  "YouTube thumbnail image — photographic/cinematic style, NOT cartoon or hyper-stylized AI.",
  "STRICT RULES: absolutely NO text, letters, numbers, words, watermarks, or logos in the image.",
  "No copyrighted characters, no real celebrity likenesses, no misleading or violent imagery.",
  "Composition: single clear focal subject, high contrast, warm/saturated palette, simple background.",
  "Must read clearly at 168×94 px (sidebar size). Avoid clutter, small details, thin lines.",
  "Lighting: natural or cinematic, avoid over-HDR/plastic look. Subtle film grain is OK.",
  "Color profile: sRGB. Avoid neon-only palettes.",
  "",
  "Subject description follows:",
].join("\n");

const THUMBNAIL_PROMPT_MAX = 3900;

/**
 * Generate a thumbnail image from the latest packaging_draft thumbnail_image_prompt (OpenAI Images API).
 * Output: 1792×1024 px landscape (closest DALL-E 3 size to 16:9), HD quality.
 * The image is a starting point; creators should add text overlays in a separate tool.
 */
export async function generateThumbnailImageFromEpisode(
  _prev: StudioPipelinePrestepState,
  formData: FormData,
): Promise<StudioPipelinePrestepState> {
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

  const openai = await getOrgLlmCredentialForProvider(
    supabase,
    auth.ctx.organizationId,
    "openai",
  );
  if (!openai) return { error: ActionErrorCode.studioOpenAiRequiredForThumbnail };

  const { data: packRows, error: packErr } = await supabase
    .from("studio_production_artifacts")
    .select("content_text, created_at")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "packaging_draft")
    .order("created_at", { ascending: false })
    .limit(1);

  if (packErr) return { error: ActionErrorCode.dbError };
  const rawPack = packRows?.[0]?.content_text ?? "";
  const parsed = parsePackagingDraftContent(rawPack);
  const prompt = (parsed?.thumbnail_image_prompt ?? "").trim();
  if (!prompt) return { error: ActionErrorCode.studioPipelineNeedPackaging };

  const thumbCustomInstructions = String(formData.get("custom_instructions") ?? "").trim();
  const thumbModel = String(formData.get("model") ?? "").trim() || "dall-e-3";
  const isDalle3 = thumbModel === "dall-e-3";
  const thumbSize = isDalle3 ? "1792x1024" : "1024x1024";
  const thumbQuality = isDalle3
    ? (String(formData.get("quality") ?? "").trim() || "hd")
    : "standard";

  const imagePrompt = [
    THUMBNAIL_COMPLIANCE_PREFIX,
    prompt,
    ...(thumbCustomInstructions ? [`\nAdditional style instructions: ${thumbCustomInstructions}`] : []),
  ].join("\n").slice(0, THUMBNAIL_PROMPT_MAX);

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: thumbModel,
      prompt: imagePrompt,
      n: 1,
      size: thumbSize,
      ...(isDalle3 ? { quality: thumbQuality } : {}),
      response_format: "b64_json",
    }),
  });

  if (!res.ok) return { error: ActionErrorCode.studioLlmRequestFailed };

  const body = (await res.json()) as {
    data?: Array<{ b64_json?: string; revised_prompt?: string }>;
  };
  const b64 = body.data?.[0]?.b64_json;
  if (!b64?.trim()) return { error: ActionErrorCode.studioLlmBadResponse };

  const imageDataUri = `data:image/png;base64,${b64}`;

  const revised = body.data?.[0]?.revised_prompt;
  const meta: Record<string, Json> = {
    source: "openai_images",
    model: thumbModel,
    size: thumbSize,
    quality: thumbQuality,
    youtube_spec: "1280x720_16:9_sRGB_JPG_2MB",
    generated_at: new Date().toISOString(),
    ...(typeof revised === "string" && revised.trim()
      ? { revised_prompt: revised }
      : {}),
  };

  const contentText = [
    `prompt_used:\n${imagePrompt}`,
    revised ? `\nrevised_prompt:\n${revised}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const up = await upsertLatestArtifact(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    "thumbnail",
    contentText,
    "openai",
    meta,
    { external_url: imageDataUri },
  );
  if (!up.ok) return { error: ActionErrorCode.dbError };

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_THUMBNAIL_GENERATE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { model: thumbModel, quality: thumbQuality, size: thumbSize },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true };
}
