"use server";

import { revalidatePath } from "next/cache";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { chooseStudioDraftLlmProvider } from "@/lib/studio-productions/episode-llm-models";
import {
  EPISODE_DRAFT_ROLES,
  generateDraftWithLlm,
  getOrgLlmCredentialForProvider,
  getOrgLlmProviderAvailability,
  refineDraftWithLlm,
  buildDraftPrompt,
  type LlmDraftPayload,
  type OrgLlmCredential,
} from "@/lib/studio-productions/episode-llm";
import type { Json } from "@/types/database.types";
import type { StudioEpisodeLlmActionState } from "@/lib/studio-productions/episode-llm-ui";
import {
  getDraftSnapshotForOrg,
  insertDraftSnapshotIfChanged,
  shouldArchiveSupersededDraft,
  upsertEpisodeDraftArtifactsFromPayload,
} from "@/lib/studio-productions/draft-snapshots";

type LlmTurn = { role: "user" | "assistant"; content: string; at: string };

/** Max chars from the generate form briefing field (DoS guard). */
const DRAFT_BRIEFING_MAX_CHARS = 12_000;

function nowIso() {
  return new Date().toISOString();
}

async function resolveOrgDraftLlm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  formData: FormData,
): Promise<
  | { ok: true; cred: OrgLlmCredential; modelRaw: string }
  | { ok: false; error: string }
> {
  const providerRaw = String(formData.get("llm_provider") ?? "");
  const modelRaw = String(formData.get("llm_model") ?? "").trim();

  const availability = await getOrgLlmProviderAvailability(
    supabase,
    organizationId,
  );
  const chosen = chooseStudioDraftLlmProvider(availability, providerRaw);
  if (!chosen) {
    if (!availability.openai && !availability.anthropic) {
      return { ok: false, error: ActionErrorCode.studioLlmNoProvider };
    }
    return { ok: false, error: ActionErrorCode.studioLlmProviderNotAvailable };
  }

  const cred = await getOrgLlmCredentialForProvider(
    supabase,
    organizationId,
    chosen,
  );
  if (!cred) {
    return { ok: false, error: ActionErrorCode.studioLlmProviderNotAvailable };
  }

  return { ok: true, cred, modelRaw };
}

async function deleteLlmDraftArtifacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  episodeId: string,
  organizationId: string,
) {
  const { data: arts } = await supabase
    .from("studio_production_artifacts")
    .select("id, metadata")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .in("artifact_role", [...EPISODE_DRAFT_ROLES]);

  for (const a of arts ?? []) {
    const m = a.metadata as { source?: string } | null;
    if (m?.source === "llm") {
      await supabase.from("studio_production_artifacts").delete().eq("id", a.id);
    }
  }
}

async function insertDraftArtifacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
  payload: LlmDraftPayload,
  providerLabel: string,
  model: string,
) {
  const tool =
    providerLabel === "openai"
      ? "openai"
      : providerLabel === "anthropic"
        ? "anthropic"
        : "other";
  const rows = [
    {
      organization_id: organizationId,
      episode_id: episodeId,
      artifact_role: "hook",
      tool_platform: tool,
      content_text: payload.hook,
      metadata: {
        source: "llm",
        model,
        provider: providerLabel,
        kind: "hook",
      } as Json,
      sort_order: 0,
    },
    {
      organization_id: organizationId,
      episode_id: episodeId,
      artifact_role: "title",
      tool_platform: tool,
      content_text: payload.title,
      metadata: {
        source: "llm",
        model,
        provider: providerLabel,
        kind: "title",
      } as Json,
      sort_order: 1,
    },
    {
      organization_id: organizationId,
      episode_id: episodeId,
      artifact_role: "script_draft",
      tool_platform: tool,
      content_text: payload.script_draft,
      metadata: {
        source: "llm",
        model,
        provider: providerLabel,
        kind: "script_draft",
      } as Json,
      sort_order: 2,
    },
  ];
  const { error } = await supabase.from("studio_production_artifacts").insert(rows);
  return error;
}

async function loadEpisodeDraftPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  episodeId: string,
  organizationId: string,
): Promise<LlmDraftPayload> {
  const { data: arts } = await supabase
    .from("studio_production_artifacts")
    .select("artifact_role, content_text")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .in("artifact_role", [...EPISODE_DRAFT_ROLES]);

  const out: LlmDraftPayload = { hook: "", title: "", script_draft: "" };
  for (const a of arts ?? []) {
    if (a.artifact_role === "hook") out.hook = a.content_text ?? "";
    if (a.artifact_role === "title") out.title = a.content_text ?? "";
    if (a.artifact_role === "script_draft") out.script_draft = a.content_text ?? "";
  }
  return out;
}

/** Archives replaced live draft before LLM overwrite; false = DB failure. */
async function archiveSupersededDraftIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
  prior: LlmDraftPayload,
  next: LlmDraftPayload,
  reason: "before_llm_generate" | "before_llm_refine",
): Promise<boolean> {
  if (!shouldArchiveSupersededDraft(prior, next)) return true;
  try {
    await insertDraftSnapshotIfChanged(
      supabase,
      organizationId,
      episodeId,
      prior,
      "superseded",
      { reason } as Json,
    );
    return true;
  } catch {
    return false;
  }
}

async function upsertThreadTurns(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
  provider: string,
  model: string,
  turns: LlmTurn[],
) {
  const { data: existing } = await supabase
    .from("studio_episode_llm_threads")
    .select("id, turns")
    .eq("episode_id", episodeId)
    .maybeSingle();

  const merged = [...(Array.isArray(existing?.turns) ? (existing.turns as LlmTurn[]) : []), ...turns];

  const row = {
    organization_id: organizationId,
    episode_id: episodeId,
    provider,
    model,
    turns: merged as unknown as Json,
    updated_at: nowIso(),
  };

  if (existing?.id) {
    await supabase
      .from("studio_episode_llm_threads")
      .update(row)
      .eq("id", existing.id);
  } else {
    await supabase.from("studio_episode_llm_threads").insert(row);
  }
}

export async function generateStudioEpisodeDraft(
  _prev: StudioEpisodeLlmActionState,
  formData: FormData,
): Promise<StudioEpisodeLlmActionState> {
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!episodeId) return { error: ActionErrorCode.unexpected };

  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioLlmDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const llm = await resolveOrgDraftLlm(supabase, auth.ctx.organizationId, formData);
  if (!llm.ok) return { error: llm.error };
  const { cred, modelRaw } = llm;

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const briefingRaw = String(formData.get("draft_briefing") ?? "");
  const userBriefing = briefingRaw.trim().slice(0, DRAFT_BRIEFING_MAX_CHARS);

  const userPrompt = buildDraftPrompt({
    episodeTitle: episode.title,
    notes: episode.notes ?? "",
    nicheName: episode.studio_niches?.display_name ?? null,
    formatName: episode.studio_format_templates?.display_name ?? null,
    channelLabel: episode.studio_distribution_channels?.label ?? null,
    channelPlatform: episode.studio_distribution_channels?.platform ?? null,
    channelMetadata: episode.studio_distribution_channels?.metadata ?? {},
    distributionLabel: episode.distribution_label ?? "",
    userBriefing,
  });

  const result = await generateDraftWithLlm(cred, userPrompt, {
    model: modelRaw,
  });
  if (!result.ok) {
    if (result.status === 422) return { error: ActionErrorCode.studioLlmBadResponse };
    return { error: ActionErrorCode.studioLlmRequestFailed };
  }

  const priorLive = await loadEpisodeDraftPayload(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );

  const supersededOk = await archiveSupersededDraftIfNeeded(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    priorLive,
    result.payload,
    "before_llm_generate",
  );
  if (!supersededOk) return { error: ActionErrorCode.dbError };

  await deleteLlmDraftArtifacts(supabase, episodeId, auth.ctx.organizationId);
  const insErr = await insertDraftArtifacts(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    result.payload,
    cred.provider,
    result.model,
  );
  if (insErr) return { error: ActionErrorCode.dbError };

  try {
    await insertDraftSnapshotIfChanged(
      supabase,
      auth.ctx.organizationId,
      episodeId,
      {
        hook: result.payload.hook,
        title: result.payload.title,
        script_draft: result.payload.script_draft,
      },
      "llm_generate",
      { provider: cred.provider, model: result.model } as Json,
    );
  } catch {
    return { error: ActionErrorCode.dbError };
  }

  const generateUserTurn =
    userBriefing.length > 0
      ? `[generate initial draft]\n\nUser direction:\n${userBriefing}`
      : "[generate initial draft]";

  await upsertThreadTurns(supabase, auth.ctx.organizationId, episodeId, cred.provider, result.model, [
    {
      role: "user",
      content: generateUserTurn,
      at: nowIso(),
    },
    {
      role: "assistant",
      content: JSON.stringify(result.payload),
      at: nowIso(),
    },
  ]);

  revalidatePath(`/dashboard/productions/${episodeId}`);
  revalidatePath("/dashboard/productions");
  return {
    success: "draftGenerated",
    draft: {
      hook: result.payload.hook,
      title: result.payload.title,
      script_draft: result.payload.script_draft,
    },
  };
}

export async function refineStudioEpisodeDraft(
  _prev: StudioEpisodeLlmActionState,
  formData: FormData,
): Promise<StudioEpisodeLlmActionState> {
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const instruction = String(formData.get("instruction") ?? "").trim();
  if (!episodeId) return { error: ActionErrorCode.unexpected };
  if (!instruction) return { error: ActionErrorCode.studioLlmInstructionRequired };

  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioLlmDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const llm = await resolveOrgDraftLlm(supabase, auth.ctx.organizationId, formData);
  if (!llm.ok) return { error: llm.error };
  const { cred, modelRaw } = llm;

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const current = await loadEpisodeDraftPayload(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );

  const result = await refineDraftWithLlm(cred, instruction, current, {
    model: modelRaw,
  });
  if (!result.ok) {
    if (result.status === 422) return { error: ActionErrorCode.studioLlmBadResponse };
    return { error: ActionErrorCode.studioLlmRequestFailed };
  }

  const supersededRefineOk = await archiveSupersededDraftIfNeeded(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    current,
    result.payload,
    "before_llm_refine",
  );
  if (!supersededRefineOk) return { error: ActionErrorCode.dbError };

  await deleteLlmDraftArtifacts(supabase, episodeId, auth.ctx.organizationId);
  const insErr = await insertDraftArtifacts(
    supabase,
    auth.ctx.organizationId,
    episodeId,
    result.payload,
    cred.provider,
    result.model,
  );
  if (insErr) return { error: ActionErrorCode.dbError };

  try {
    await insertDraftSnapshotIfChanged(
      supabase,
      auth.ctx.organizationId,
      episodeId,
      {
        hook: result.payload.hook,
        title: result.payload.title,
        script_draft: result.payload.script_draft,
      },
      "llm_refine",
      { provider: cred.provider, model: result.model } as Json,
    );
  } catch {
    return { error: ActionErrorCode.dbError };
  }

  await upsertThreadTurns(supabase, auth.ctx.organizationId, episodeId, cred.provider, result.model, [
    { role: "user", content: instruction, at: nowIso() },
    {
      role: "assistant",
      content: JSON.stringify(result.payload),
      at: nowIso(),
    },
  ]);

  revalidatePath(`/dashboard/productions/${episodeId}`);
  revalidatePath("/dashboard/productions");
  return {
    success: "draftRefined",
    draft: {
      hook: result.payload.hook,
      title: result.payload.title,
      script_draft: result.payload.script_draft,
    },
  };
}

export async function saveStudioEpisodeDraftManual(
  _prev: StudioEpisodeLlmActionState,
  formData: FormData,
): Promise<StudioEpisodeLlmActionState> {
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!episodeId) return { error: ActionErrorCode.unexpected };

  const hook = String(formData.get("hook") ?? "");
  const title = String(formData.get("title") ?? "");
  const scriptDraft = String(formData.get("script_draft") ?? "");

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };
  const organizationId = auth.ctx.organizationId;

  const episode = await getStudioEpisodeForOrg(supabase, episodeId, organizationId);
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  try {
    await upsertEpisodeDraftArtifactsFromPayload(supabase, organizationId, episodeId, {
      hook,
      title,
      script_draft: scriptDraft,
    });
    await insertDraftSnapshotIfChanged(
      supabase,
      organizationId,
      episodeId,
      {
        hook,
        title,
        script_draft: scriptDraft,
      },
      "user_save",
      {},
    );
  } catch {
    return { error: ActionErrorCode.dbError };
  }

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { success: "draftSaved" };
}

export async function restoreStudioEpisodeDraftFromSnapshot(
  _prev: StudioEpisodeLlmActionState,
  formData: FormData,
): Promise<StudioEpisodeLlmActionState> {
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const snapshotId = String(formData.get("snapshot_id") ?? "").trim();
  if (!episodeId || !snapshotId) return { error: ActionErrorCode.unexpected };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };
  const organizationId = auth.ctx.organizationId;

  const snap = await getDraftSnapshotForOrg(supabase, snapshotId, episodeId, organizationId);
  if (!snap) return { error: ActionErrorCode.studioDraftSnapshotNotFound };

  try {
    await upsertEpisodeDraftArtifactsFromPayload(supabase, organizationId, episodeId, {
      hook: snap.hook,
      title: snap.title,
      script_draft: snap.script_draft,
    });
    await insertDraftSnapshotIfChanged(
      supabase,
      organizationId,
      episodeId,
      {
        hook: snap.hook,
        title: snap.title,
        script_draft: snap.script_draft,
      },
      "restore",
      { restored_from_snapshot_id: snapshotId } as Json,
      { skipDedup: true },
    );
  } catch {
    return { error: ActionErrorCode.dbError };
  }

  revalidatePath(`/dashboard/productions/${episodeId}`);
  revalidatePath("/dashboard/productions");
  return { success: "draftSaved" };
}

export async function triggerRunwayRenderStub(
  _prev: StudioEpisodeLlmActionState,
  formData: FormData,
): Promise<StudioEpisodeLlmActionState> {
  void _prev;
  void formData;
  return { error: ActionErrorCode.studioRunwayManualOnly };
}

export async function triggerYoutubeUploadStub(
  _prev: StudioEpisodeLlmActionState,
  formData: FormData,
): Promise<StudioEpisodeLlmActionState> {
  void _prev;
  void formData;
  return { error: ActionErrorCode.studioYoutubeUploadNotAvailable };
}
