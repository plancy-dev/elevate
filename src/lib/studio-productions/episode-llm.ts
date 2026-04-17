/**
 * Episode draft generation via org-stored LLM keys (OpenAI / Anthropic).
 * Server-only; requires STUDIO_INTEGRATIONS_ENABLED and encryption configured.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { decryptProviderSecret } from "@/lib/studio-integrations/crypto";
import type { EpisodeDraftRole } from "@/lib/studio-productions/constants";
import { EPISODE_DRAFT_ROLES } from "@/lib/studio-productions/constants";
import {
  isAllowedDraftModel,
  resolveDraftModel,
  type StudioDraftLlmProvider,
} from "@/lib/studio-productions/episode-llm-models";

export type { EpisodeDraftRole };
export { EPISODE_DRAFT_ROLES };

export type LlmDraftPayload = {
  hook: string;
  title: string;
  script_draft: string;
};

export type OrgLlmCredential =
  | { provider: "openai"; apiKey: string }
  | { provider: "anthropic"; apiKey: string };

export async function getOrgLlmCredentialForProvider(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  provider: StudioDraftLlmProvider,
): Promise<OrgLlmCredential | null> {
  const { data: row, error } = await supabase
    .from("studio_org_provider_connections")
    .select("secret_ciphertext")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !row) return null;
  try {
    const apiKey = decryptProviderSecret(row.secret_ciphertext);
    if (!apiKey.trim()) return null;
    return { provider, apiKey: apiKey.trim() };
  } catch {
    return null;
  }
}

/** True when a usable API key exists for that provider. */
export async function getOrgLlmProviderAvailability(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{ openai: boolean; anthropic: boolean }> {
  const [o, a] = await Promise.all([
    getOrgLlmCredentialForProvider(supabase, organizationId, "openai"),
    getOrgLlmCredentialForProvider(supabase, organizationId, "anthropic"),
  ]);
  return { openai: o != null, anthropic: a != null };
}

/** First available OpenAI or Anthropic key (OpenAI preferred). */
export async function getOrgLlmCredential(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<OrgLlmCredential | null> {
  const openai = await getOrgLlmCredentialForProvider(
    supabase,
    organizationId,
    "openai",
  );
  if (openai) return openai;
  return getOrgLlmCredentialForProvider(supabase, organizationId, "anthropic");
}

/**
 * Picks OpenAI vs Anthropic credentials from the allowlisted model id (same rules as
 * timed script / packaging presteps). Avoids using OpenAI when the user selected a Claude model.
 */
export async function resolveOrgLlmCredentialForDraftModel(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  requestedModel: string,
): Promise<
  | { ok: true; cred: OrgLlmCredential; model: string }
  | { ok: false }
> {
  const availability = await getOrgLlmProviderAvailability(
    supabase,
    organizationId,
  );

  if (isAllowedDraftModel("anthropic", requestedModel) && availability.anthropic) {
    const cred = await getOrgLlmCredentialForProvider(
      supabase,
      organizationId,
      "anthropic",
    );
    if (!cred) return { ok: false };
    return {
      ok: true,
      cred,
      model: resolveDraftModel("anthropic", requestedModel),
    };
  }
  if (isAllowedDraftModel("openai", requestedModel) && availability.openai) {
    const cred = await getOrgLlmCredentialForProvider(
      supabase,
      organizationId,
      "openai",
    );
    if (!cred) return { ok: false };
    return {
      ok: true,
      cred,
      model: resolveDraftModel("openai", requestedModel),
    };
  }
  if (availability.anthropic) {
    const cred = await getOrgLlmCredentialForProvider(
      supabase,
      organizationId,
      "anthropic",
    );
    if (!cred) return { ok: false };
    return {
      ok: true,
      cred,
      model: resolveDraftModel("anthropic", requestedModel),
    };
  }
  if (availability.openai) {
    const cred = await getOrgLlmCredentialForProvider(
      supabase,
      organizationId,
      "openai",
    );
    if (!cred) return { ok: false };
    return {
      ok: true,
      cred,
      model: resolveDraftModel("openai", requestedModel),
    };
  }
  return { ok: false };
}

/** True if any of hook / title / script_draft has non-whitespace content. */
export function hasNonEmptyDraftText(d: LlmDraftPayload | undefined): boolean {
  if (!d) return false;
  return (
    d.hook.trim().length > 0 ||
    d.title.trim().length > 0 ||
    d.script_draft.trim().length > 0
  );
}

export function buildDraftPrompt(context: {
  episodeTitle: string;
  notes: string;
  nicheName: string | null;
  formatName: string | null;
  channelLabel: string | null;
  channelPlatform: string | null;
  channelMetadata: Json;
  distributionLabel: string;
  /** Project-level brand guide injected as RAG context (tone, persona, restrictions). */
  brandGuide?: string;
  /** Optional user instructions (tone, audience, channel angle, references). */
  userBriefing?: string;
  /**
   * develop — include current on-editor draft so the model can refine/continue it.
   * fresh — ignore current draft text; also down-rank stale episode metadata if it conflicts with direction.
   */
  generateMode?: "develop" | "fresh";
  /** Current hook/title/script from the editor; used when generateMode is develop. */
  currentDraft?: LlmDraftPayload;
  /**
   * Seeded template bias (English). Injected before “Additional direction”; user briefing
   * remains highest priority for topic and tone when they conflict.
   */
  templateBias?: string;
}): string {
  const meta =
    typeof context.channelMetadata === "object" &&
    context.channelMetadata !== null &&
    !Array.isArray(context.channelMetadata)
      ? JSON.stringify(context.channelMetadata)
      : "{}";
  const briefing = (context.userBriefing ?? "").trim();
  const templateBias = (context.templateBias ?? "").trim();
  const brandGuide = (context.brandGuide ?? "").trim();
  const mode = context.generateMode ?? "develop";
  const draft = context.currentDraft;
  const hasDraftForDevelop =
    mode === "develop" && hasNonEmptyDraftText(draft);

  const modePreamble =
    mode === "fresh"
      ? "Generation mode: FRESH. Write a new hook, title, and script_draft as if starting from scratch for this episode. " +
        "Do not treat the episode working title, creator notes, niche, format, or channel profile as binding for topic, setting, or vocabulary when they conflict with 'Additional direction' below—those fields may reflect an older idea. " +
        "The on-editor draft text is intentionally omitted from this prompt; do not assume or revive its themes."
      : "Generation mode: DEVELOP. Improve, tighten, or re-angle the current on-editor draft (below when present). " +
        "Keep continuity unless Additional direction explicitly asks for a different angle.";

  const lines: string[] = [
    modePreamble,
    "",
    `Episode working title: ${context.episodeTitle}`,
    `Distribution preset: ${context.distributionLabel || "(none)"}`,
    context.nicheName ? `Niche: ${context.nicheName}` : "",
    context.formatName ? `Format template: ${context.formatName}` : "",
    context.channelLabel
      ? `Target channel label: ${context.channelLabel}`
      : "",
    context.channelPlatform ? `Channel platform: ${context.channelPlatform}` : "",
    `Channel profile JSON (tone/modes; may be empty): ${meta}`,
    `Creator notes: ${context.notes || "(none)"}`,
  ];

  if (hasDraftForDevelop && draft) {
    lines.push(
      "",
      "Current on-editor draft (revise from this; JSON):",
      JSON.stringify({
        hook: draft.hook,
        title: draft.title,
        script_draft: draft.script_draft,
      }),
    );
  }

  if (brandGuide.length > 0) {
    lines.push(
      "",
      "Project brand guide (persona, tone, restrictions — always respect unless user briefing explicitly overrides):",
      brandGuide,
    );
  }

  if (templateBias.length > 0) {
    lines.push(
      "",
      "Style and structure bias for this generation (applies unless Additional direction below explicitly overrides it):",
      templateBias,
    );
  }

  if (briefing.length > 0) {
    lines.push(
      "",
      "Additional direction for this generation (highest priority for topic, tone, and new subject matter):",
      briefing,
    );
  }

  if (mode === "fresh" && briefing.length > 0) {
    lines.push(
      "",
      "Reminder (fresh mode): If any background field above (title, notes, niche, channel) suggests a different audience or theme than Additional direction, follow Additional direction and omit the conflicting vocabulary and setting from the output.",
    );
  }

  lines.push(
    "",
    "Important: You do not have internet access, YouTube access, or any ability to fetch URLs. " +
      "URLs mentioned by the user are opaque unless the same message includes pasted text " +
      "(transcript, lyrics, description, bullet summary). Do not invent song titles, artists, " +
      "plots, or video-specific facts from a bare link. If the user asks to summarize or adapt " +
      "external media and only a URL is given without pasted content, refuse fabrication: " +
      "use hook/title/script_draft to briefly ask them to paste key text in creator notes or " +
      "the direction field, in the same language as the rest of the prompt.",
    "",
    "Respond with a single JSON object only, keys: hook (string), title (string), script_draft (string).",
    "title = suggested video/post title; hook = opening hook line; script_draft = short draft body suitable for the channel (not stage directions).",
  );

  return lines.filter(Boolean).join("\n");
}

export async function generateDraftWithLlm(
  cred: OrgLlmCredential,
  userPrompt: string,
  options?: { model?: string | null },
): Promise<{ ok: true; payload: LlmDraftPayload; model: string } | { ok: false; status: number }> {
  const system =
    "You are a senior short-form content strategist. Follow the channel context strictly. " +
    "Never fabricate specifics about videos, music, or links you were not given as plain text in the user message. " +
    "Output valid JSON only.";
  const model = resolveDraftModel(cred.provider, options?.model);

  if (cred.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const parsed = parseDraftJson(text);
    if (!parsed) return { ok: false, status: 422 };
    return { ok: true, payload: parsed, model };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": cred.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const body = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    body.content?.find((c) => c.type === "text")?.text ?? "";
  const parsed = parseDraftJson(text);
  if (!parsed) return { ok: false, status: 422 };
  return { ok: true, payload: parsed, model };
}

function parseDraftJson(text: string): LlmDraftPayload | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : trimmed;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const hook = String(v.hook ?? "").trim();
    const title = String(v.title ?? "").trim();
    const script_draft = String(v.script_draft ?? v.script ?? "").trim();
    if (!hook && !title && !script_draft) return null;
    return { hook, title, script_draft };
  } catch {
    return null;
  }
}

export async function refineDraftWithLlm(
  cred: OrgLlmCredential,
  instruction: string,
  current: LlmDraftPayload,
  options?: { model?: string | null },
): Promise<{ ok: true; payload: LlmDraftPayload; model: string } | { ok: false; status: number }> {
  const userPrompt = [
    "Current draft JSON:",
    JSON.stringify(current),
    "",
    "User instruction for revision:",
    instruction,
    "",
    "You do not have internet or YouTube access. Do not invent facts from bare URLs; if the instruction depends on unpasted media, keep changes minimal and note the need for pasted transcript or summary.",
    "",
    "Return a single JSON object only with keys: hook, title, script_draft.",
  ].join("\n");
  return generateDraftWithLlm(cred, userPrompt, options);
}

export function draftArtifactMetadata(
  source: "llm" | "user",
  extra: Record<string, unknown> = {},
): Json {
  return {
    source,
    ...extra,
  } as Json;
}
