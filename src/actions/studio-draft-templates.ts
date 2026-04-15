"use server";

import { revalidatePath } from "next/cache";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import {
  listDraftTemplatesForOrg,
  type StudioEpisodeDraftTemplateRow,
} from "@/lib/data/studio-draft-templates";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import {
  STUDIO_DRAFT_TEMPLATE_BIAS_MAX,
  STUDIO_DRAFT_TEMPLATE_NAME_MAX,
} from "@/lib/studio-productions/draft-prompt-templates";

export type ListStudioDraftTemplatesResult =
  | { ok: true; templates: StudioEpisodeDraftTemplateRow[] }
  | { ok: false; error: string };

/** For client refresh after CRUD — avoids full-page router.refresh(). */
export async function listStudioDraftTemplatesForCurrentOrg(): Promise<ListStudioDraftTemplatesResult> {
  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { ok: false, error: auth.error };
  const templates = await listDraftTemplatesForOrg(
    supabase,
    auth.ctx.organizationId,
  );
  return { ok: true, templates };
}

export type StudioDraftTemplateActionState =
  | { error?: string; success?: "saved" | "deleted" }
  | undefined;

function revalidateProductionsDashboard() {
  revalidatePath("/dashboard/productions");
}

export async function createStudioDraftTemplate(
  _prev: StudioDraftTemplateActionState,
  formData: FormData,
): Promise<StudioDraftTemplateActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const biasBody = String(formData.get("bias_body") ?? "").trim();

  if (!name) return { error: ActionErrorCode.studioDraftTemplateNameRequired };
  if (name.length > STUDIO_DRAFT_TEMPLATE_NAME_MAX) {
    return { error: ActionErrorCode.studioDraftTemplateNameTooLong };
  }
  if (!biasBody) return { error: ActionErrorCode.studioDraftTemplateBiasRequired };
  if (biasBody.length > STUDIO_DRAFT_TEMPLATE_BIAS_MAX) {
    return { error: ActionErrorCode.studioDraftTemplateBiasTooLong };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { error } = await supabase.from("studio_episode_draft_templates").insert({
    organization_id: auth.ctx.organizationId,
    name,
    bias_body: biasBody,
    created_by: auth.ctx.userId,
  });

  if (error) return { error: ActionErrorCode.dbError };
  revalidateProductionsDashboard();
  return { success: "saved" };
}

export async function updateStudioDraftTemplate(
  _prev: StudioDraftTemplateActionState,
  formData: FormData,
): Promise<StudioDraftTemplateActionState> {
  const id = String(formData.get("template_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const biasBody = String(formData.get("bias_body") ?? "").trim();

  if (!id) return { error: ActionErrorCode.unexpected };
  if (!name) return { error: ActionErrorCode.studioDraftTemplateNameRequired };
  if (name.length > STUDIO_DRAFT_TEMPLATE_NAME_MAX) {
    return { error: ActionErrorCode.studioDraftTemplateNameTooLong };
  }
  if (!biasBody) return { error: ActionErrorCode.studioDraftTemplateBiasRequired };
  if (biasBody.length > STUDIO_DRAFT_TEMPLATE_BIAS_MAX) {
    return { error: ActionErrorCode.studioDraftTemplateBiasTooLong };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: existing, error: fetchErr } = await supabase
    .from("studio_episode_draft_templates")
    .select("id")
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { error: ActionErrorCode.studioDraftTemplateNotFound };
  }

  const { error } = await supabase
    .from("studio_episode_draft_templates")
    .update({
      name,
      bias_body: biasBody,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: ActionErrorCode.dbError };
  revalidateProductionsDashboard();
  return { success: "saved" };
}

export async function deleteStudioDraftTemplate(
  _prev: StudioDraftTemplateActionState,
  formData: FormData,
): Promise<StudioDraftTemplateActionState> {
  const id = String(formData.get("template_id") ?? "").trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: deleted, error } = await supabase
    .from("studio_episode_draft_templates")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!deleted?.length) return { error: ActionErrorCode.studioDraftTemplateNotFound };
  revalidateProductionsDashboard();
  return { success: "deleted" };
}
