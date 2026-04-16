"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { isStudioEpisodeStatus } from "@/lib/studio-productions/constants";
import {
  isDistributionChannelPresetLabel,
  resolveDistributionLabelFromForm,
} from "@/lib/studio-productions/distribution";
import { getStudioProjectById } from "@/lib/data/studio-projects";
import { parseOptionalUuidFromForm } from "@/lib/studio-productions/form-uuid";
import {
  validateContentText,
  validateMetadataJson,
  validateOptionalHttpsUrl,
} from "@/lib/studio-productions/validate";
import type { Json } from "@/types/database.types";

/** `success` is set when the action completes without redirect (create/delete episode use `redirect()`). */
export type StudioProductionActionState =
  | {
      error?: string;
      success?:
        | "episode_saved"
        | "artifact_created"
        | "artifact_updated"
        | "artifact_deleted";
    }
  | undefined;

function parseJsonField(raw: string | null): Json {
  if (raw == null || raw.trim() === "") return {};
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return {};
  }
}

export async function createStudioEpisode(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: ActionErrorCode.studioTitleRequired };

  const statusRaw = String(formData.get("status") ?? "draft").trim();
  if (!isStudioEpisodeStatus(statusRaw)) {
    return { error: ActionErrorCode.studioInvalidStatus };
  }

  const publishCheck = validateOptionalHttpsUrl(
    String(formData.get("publish_url") ?? ""),
  );
  if (!publishCheck.ok) return { error: publishCheck.error };

  const notesCheck = validateContentText(
    String(formData.get("notes") ?? ""),
  );
  if (!notesCheck.ok) return { error: notesCheck.error };

  const distributionLabel = resolveDistributionLabelFromForm(formData);

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const requestedProjectId = parseOptionalUuidFromForm(formData, "project_id");
  let projectId: string | null = null;
  if (requestedProjectId) {
    const proj = await getStudioProjectById(
      supabase,
      auth.ctx.organizationId,
      requestedProjectId,
    );
    if (!proj) return { error: ActionErrorCode.studioProjectInvalid };
    projectId = proj.id;
  }

  const { data, error } = await supabase
    .from("studio_production_episodes")
    .insert({
      organization_id: auth.ctx.organizationId,
      title,
      status: statusRaw,
      publish_url: publishCheck.value,
      distribution_label: distributionLabel,
      notes: notesCheck.value,
      created_by: auth.ctx.userId,
      updated_at: new Date().toISOString(),
      studio_niche_id: null,
      studio_format_template_id: null,
      studio_distribution_channel_id: null,
      project_id: projectId,
    })
    .select("id")
    .single();

  if (error || !data?.id) return { error: ActionErrorCode.dbError };

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/projects");
  redirect(`/dashboard/productions/${data.id}`);
}

export async function updateStudioEpisode(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const id = String(formData.get("episode_id") ?? "").trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: ActionErrorCode.studioTitleRequired };

  const statusRaw = String(formData.get("status") ?? "draft").trim();
  if (!isStudioEpisodeStatus(statusRaw)) {
    return { error: ActionErrorCode.studioInvalidStatus };
  }

  const notesCheck = validateContentText(
    String(formData.get("notes") ?? ""),
  );
  if (!notesCheck.ok) return { error: notesCheck.error };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: existing, error: loadErr } = await supabase
    .from("studio_production_episodes")
    .select("publish_url, studio_distribution_channel_id, project_id")
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();

  if (loadErr || !existing) return { error: ActionErrorCode.studioEpisodeNotFound };

  const publishCheck = formData.has("publish_url")
    ? validateOptionalHttpsUrl(String(formData.get("publish_url") ?? ""))
    : ({ ok: true, value: existing.publish_url } as const);
  if (!publishCheck.ok) return { error: publishCheck.error };

  const distributionLabel = resolveDistributionLabelFromForm(formData);

  let studioDistributionChannelId: string | null;
  if (formData.has("studio_distribution_channel_id")) {
    let parsed = parseOptionalUuidFromForm(
      formData,
      "studio_distribution_channel_id",
    );
    if (!isDistributionChannelPresetLabel(distributionLabel)) {
      parsed = null;
    }
    if (parsed) {
      const { data: chRow } = await supabase
        .from("studio_distribution_channels")
        .select("id")
        .eq("id", parsed)
        .eq("organization_id", auth.ctx.organizationId)
        .maybeSingle();
      if (!chRow) parsed = null;
    }
    studioDistributionChannelId = parsed;
  } else {
    studioDistributionChannelId = existing.studio_distribution_channel_id;
  }

  const requestedProjectId = parseOptionalUuidFromForm(formData, "project_id");
  let nextProjectId: string | null;
  if (formData.has("project_id")) {
    if (requestedProjectId) {
      const proj = await getStudioProjectById(
        supabase,
        auth.ctx.organizationId,
        requestedProjectId,
      );
      if (!proj) return { error: ActionErrorCode.studioProjectInvalid };
      nextProjectId = requestedProjectId;
    } else {
      nextProjectId = null;
    }
  } else {
    nextProjectId = existing.project_id;
  }

  const { data: updatedRows, error } = await supabase
    .from("studio_production_episodes")
    .update({
      title,
      status: statusRaw,
      publish_url: publishCheck.value,
      distribution_label: distributionLabel,
      notes: notesCheck.value,
      updated_at: new Date().toISOString(),
      studio_niche_id: null,
      studio_format_template_id: null,
      studio_distribution_channel_id: studioDistributionChannelId,
      project_id: nextProjectId,
    })
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!updatedRows?.length) return { error: ActionErrorCode.studioEpisodeNotFound };

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/projects");
  revalidatePath(`/dashboard/productions/${id}`);
  return { success: "episode_saved" };
}

export async function deleteStudioEpisode(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const id = String(formData.get("episode_id") ?? "").trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: deleted, error } = await supabase
    .from("studio_production_episodes")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!deleted?.length) return { error: ActionErrorCode.studioEpisodeNotFound };

  revalidatePath("/dashboard/productions");
  redirect("/dashboard/productions");
}

export async function createStudioArtifact(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!episodeId) return { error: ActionErrorCode.unexpected };

  const artifactRole = String(formData.get("artifact_role") ?? "").trim();
  const toolPlatform = String(formData.get("tool_platform") ?? "").trim();
  if (!artifactRole) return { error: ActionErrorCode.studioRoleRequired };
  if (!toolPlatform) return { error: ActionErrorCode.studioRoleRequired };

  const contentCheck = validateContentText(
    String(formData.get("content_text") ?? ""),
  );
  if (!contentCheck.ok) return { error: contentCheck.error };

  const urlCheck = validateOptionalHttpsUrl(
    String(formData.get("external_url") ?? ""),
  );
  if (!urlCheck.ok) return { error: urlCheck.error };

  const metaParsed = parseJsonField(String(formData.get("metadata_json") ?? ""));
  const metaCheck = validateMetadataJson(metaParsed);
  if (!metaCheck.ok) return { error: metaCheck.error };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: ep } = await supabase
    .from("studio_production_episodes")
    .select("id")
    .eq("id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();

  if (!ep) return { error: ActionErrorCode.studioEpisodeNotFound };

  const { data: maxRows } = await supabase
    .from("studio_production_artifacts")
    .select("sort_order")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = maxRows?.[0]?.sort_order;
  const nextOrder = (maxOrder ?? -1) + 1;

  const { error } = await supabase.from("studio_production_artifacts").insert({
    organization_id: auth.ctx.organizationId,
    episode_id: episodeId,
    artifact_role: artifactRole,
    tool_platform: toolPlatform,
    content_text: contentCheck.value,
    external_url: urlCheck.value,
    metadata: metaCheck.value,
    sort_order: nextOrder,
  });

  if (error) return { error: ActionErrorCode.dbError };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { success: "artifact_created" };
}

export async function updateStudioArtifact(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!artifactId || !episodeId) return { error: ActionErrorCode.unexpected };

  const artifactRole = String(formData.get("artifact_role") ?? "").trim();
  const toolPlatform = String(formData.get("tool_platform") ?? "").trim();
  if (!artifactRole) return { error: ActionErrorCode.studioRoleRequired };
  if (!toolPlatform) return { error: ActionErrorCode.studioRoleRequired };

  const contentCheck = validateContentText(
    String(formData.get("content_text") ?? ""),
  );
  if (!contentCheck.ok) return { error: contentCheck.error };

  const urlCheck = validateOptionalHttpsUrl(
    String(formData.get("external_url") ?? ""),
  );
  if (!urlCheck.ok) return { error: urlCheck.error };

  const metaParsed = parseJsonField(String(formData.get("metadata_json") ?? ""));
  const metaCheck = validateMetadataJson(metaParsed);
  if (!metaCheck.ok) return { error: metaCheck.error };

  const sortRaw = String(formData.get("sort_order") ?? "").trim();
  let sortOrder: number | undefined;
  if (sortRaw.length > 0) {
    const n = Number.parseInt(sortRaw, 10);
    if (Number.isNaN(n) || n < 0 || n > 1_000_000) {
      return { error: ActionErrorCode.studioInvalidSortOrder };
    }
    sortOrder = n;
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: updatedArt, error } = await supabase
    .from("studio_production_artifacts")
    .update({
      artifact_role: artifactRole,
      tool_platform: toolPlatform,
      content_text: contentCheck.value,
      external_url: urlCheck.value,
      metadata: metaCheck.value,
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    })
    .eq("id", artifactId)
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!updatedArt?.length) return { error: ActionErrorCode.studioArtifactNotFound };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { success: "artifact_updated" };
}

export async function deleteStudioArtifact(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!artifactId || !episodeId) return { error: ActionErrorCode.unexpected };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: deletedArt, error } = await supabase
    .from("studio_production_artifacts")
    .delete()
    .eq("id", artifactId)
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!deletedArt?.length) return { error: ActionErrorCode.studioArtifactNotFound };

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { success: "artifact_deleted" };
}
