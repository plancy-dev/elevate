"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { isStudioEpisodeStatus } from "@/lib/studio-productions/constants";
import { resolveDistributionLabelFromForm } from "@/lib/studio-productions/distribution";
import { STUDIO_TOPIC_LINE_MAX } from "@/lib/studio-productions/constants";
import { parseOptionalUuidFromForm } from "@/lib/studio-productions/form-uuid";
import {
  validateContentText,
  validateMetadataJson,
  validateOptionalHttpsUrl,
} from "@/lib/studio-productions/validate";
import type { Json } from "@/types/database.types";

export type StudioProductionActionState = { error?: string } | undefined;

function parseJsonField(raw: string | null): Json {
  if (raw == null || raw.trim() === "") return {};
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return {};
  }
}

function replaceTopicPlaceholder(shell: string, topic: string): string {
  const t = topic.trim() || "(주제 미입력)";
  return shell.replaceAll("{topic}", t);
}

export async function createStudioEpisode(
  _prev: StudioProductionActionState,
  formData: FormData,
): Promise<StudioProductionActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: ActionErrorCode.studioTitleRequired };

  const topicLineRaw = String(formData.get("topic_line") ?? "");
  if (topicLineRaw.length > STUDIO_TOPIC_LINE_MAX) {
    return { error: ActionErrorCode.studioTopicLineTooLong };
  }
  const topicLine = topicLineRaw.trim();

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

  let studioNicheId = parseOptionalUuidFromForm(formData, "studio_niche_id");
  let studioFormatTemplateId = parseOptionalUuidFromForm(
    formData,
    "studio_format_template_id",
  );
  let studioDistributionChannelId = parseOptionalUuidFromForm(
    formData,
    "studio_distribution_channel_id",
  );

  if (distributionLabel !== "youtube_shorts") {
    studioNicheId = null;
    studioFormatTemplateId = null;
    studioDistributionChannelId = null;
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  let templateRow: {
    hook_structure: string;
    script_prompt_shell: string;
  } | null = null;

  if (studioFormatTemplateId) {
    const { data: tmpl, error: te } = await supabase
      .from("studio_format_templates")
      .select("id, hook_structure, script_prompt_shell, format_pack_id, is_active")
      .eq("id", studioFormatTemplateId)
      .maybeSingle();

    if (te || !tmpl || !tmpl.is_active) {
      return { error: ActionErrorCode.studioInvalidFormatTemplate };
    }

    const { data: pack, error: pe } = await supabase
      .from("studio_format_packs")
      .select("id, studio_niche_id, is_active")
      .eq("id", tmpl.format_pack_id)
      .maybeSingle();

    if (pe || !pack || !pack.is_active) {
      return { error: ActionErrorCode.studioInvalidFormatTemplate };
    }

    studioNicheId = pack.studio_niche_id;
    templateRow = {
      hook_structure: tmpl.hook_structure,
      script_prompt_shell: tmpl.script_prompt_shell,
    };
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
      studio_niche_id: studioNicheId,
      studio_format_template_id: studioFormatTemplateId,
      studio_distribution_channel_id: studioDistributionChannelId,
    })
    .select("id")
    .single();

  if (error || !data?.id) return { error: ActionErrorCode.dbError };

  if (templateRow) {
    const scriptBody = replaceTopicPlaceholder(
      templateRow.script_prompt_shell,
      topicLine,
    );
    const hookBody = templateRow.hook_structure.trim();

    const scriptCheck = validateContentText(scriptBody);
    if (!scriptCheck.ok) {
      return { error: scriptCheck.error };
    }
    const hookCheck = validateContentText(hookBody);
    if (!hookCheck.ok) {
      return { error: hookCheck.error };
    }

    const { error: a1 } = await supabase.from("studio_production_artifacts").insert({
      organization_id: auth.ctx.organizationId,
      episode_id: data.id,
      artifact_role: "script",
      tool_platform: "other",
      content_text: scriptCheck.value,
      sort_order: 0,
    });
    if (a1) return { error: ActionErrorCode.dbError };

    if (hookBody.length > 0) {
      const { error: a2 } = await supabase.from("studio_production_artifacts").insert({
        organization_id: auth.ctx.organizationId,
        episode_id: data.id,
        artifact_role: "prompt",
        tool_platform: "runway",
        content_text: hookCheck.value,
        sort_order: 1,
      });
      if (a2) return { error: ActionErrorCode.dbError };
    }
  }

  revalidatePath("/dashboard/productions");
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

  const publishCheck = validateOptionalHttpsUrl(
    String(formData.get("publish_url") ?? ""),
  );
  if (!publishCheck.ok) return { error: publishCheck.error };

  const notesCheck = validateContentText(
    String(formData.get("notes") ?? ""),
  );
  if (!notesCheck.ok) return { error: notesCheck.error };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const distributionLabel = resolveDistributionLabelFromForm(formData);

  let studioNicheId = parseOptionalUuidFromForm(formData, "studio_niche_id");
  let studioFormatTemplateId = parseOptionalUuidFromForm(
    formData,
    "studio_format_template_id",
  );
  let studioDistributionChannelId = parseOptionalUuidFromForm(
    formData,
    "studio_distribution_channel_id",
  );

  if (distributionLabel !== "youtube_shorts") {
    studioNicheId = null;
    studioFormatTemplateId = null;
    studioDistributionChannelId = null;
  } else if (studioFormatTemplateId) {
    const { data: tmpl, error: te } = await supabase
      .from("studio_format_templates")
      .select("format_pack_id, is_active")
      .eq("id", studioFormatTemplateId)
      .maybeSingle();
    if (te || !tmpl || !tmpl.is_active) {
      return { error: ActionErrorCode.studioInvalidFormatTemplate };
    }
    const { data: pack, error: pe } = await supabase
      .from("studio_format_packs")
      .select("studio_niche_id, is_active")
      .eq("id", tmpl.format_pack_id)
      .maybeSingle();
    if (pe || !pack || !pack.is_active) {
      return { error: ActionErrorCode.studioInvalidFormatTemplate };
    }
    studioNicheId = pack.studio_niche_id;
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
      studio_niche_id: studioNicheId,
      studio_format_template_id: studioFormatTemplateId,
      studio_distribution_channel_id: studioDistributionChannelId,
    })
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!updatedRows?.length) return { error: ActionErrorCode.studioEpisodeNotFound };

  revalidatePath("/dashboard/productions");
  revalidatePath(`/dashboard/productions/${id}`);
  return undefined;
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
  return undefined;
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
  return undefined;
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
  return undefined;
}
