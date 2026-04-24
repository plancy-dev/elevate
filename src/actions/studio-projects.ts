"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import {
  parseCharacterBibleFromFormData,
  serializeCharacterBible,
} from "@/lib/studio-productions/character-bible";
import {
  deleteCharacterReference,
  uploadCharacterReference,
} from "@/lib/studio-productions/character-reference-storage";

export type StudioProjectActionState = {
  ok?: boolean;
  error?: string;
  projectId?: string;
  slug?: string;
} | null;

const REFERENCE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const REFERENCE_IMAGE_ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63) || "project"
  );
}

export async function createStudioProject(
  _prev: StudioProjectActionState,
  formData: FormData,
): Promise<StudioProjectActionState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 200) return { error: ActionErrorCode.unexpected };

  const description = String(formData.get("description") ?? "").trim();
  const brandGuide = String(formData.get("brand_guide") ?? "").trim();
  const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await supabase
    .from("studio_projects")
    .insert({
      organization_id: auth.ctx.organizationId,
      name,
      slug,
      description,
      brand_guide: brandGuide,
    })
    .select("id, slug")
    .single();

  if (error) return { error: ActionErrorCode.unexpected };

  revalidatePath("/dashboard/productions");
  return { ok: true, projectId: data?.id, slug: data?.slug };
}

export async function updateStudioProject(
  _prev: StudioProjectActionState,
  formData: FormData,
): Promise<StudioProjectActionState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) return { error: ActionErrorCode.unexpected };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const brandGuide = String(formData.get("brand_guide") ?? "").trim();

  const patch: Database["public"]["Tables"]["studio_projects"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (name) patch.name = name;
  if (formData.has("description")) patch.description = description;
  if (formData.has("brand_guide")) patch.brand_guide = brandGuide;

  // Character Bible (ADR-009 §5): parsed when any `bible_*` field is posted.
  const hasBibleField = Array.from(formData.keys()).some((k) =>
    k.startsWith("bible_"),
  );
  if (hasBibleField) {
    const bible = parseCharacterBibleFromFormData(formData);
    patch.character_bible = serializeCharacterBible(bible);
  }

  const { error } = await supabase
    .from("studio_projects")
    .update(patch)
    .eq("id", projectId)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: ActionErrorCode.unexpected };

  revalidatePath("/dashboard/productions");
  return { ok: true, projectId };
}

/**
 * Upload a Master Reference Image for a project (Character Bible visual anchor).
 * Deletes the previous reference (if any) and persists the new public URL +
 * internal storage path on `studio_projects`.
 */
export async function uploadStudioProjectReferenceImage(
  _prev: StudioProjectActionState,
  formData: FormData,
): Promise<StudioProjectActionState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) return { error: ActionErrorCode.unexpected };

  const file = formData.get("reference_image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: ActionErrorCode.unexpected };
  }
  if (file.size > REFERENCE_IMAGE_MAX_BYTES) {
    return { error: ActionErrorCode.unexpected };
  }
  if (!REFERENCE_IMAGE_ALLOWED_MIMES.has(file.type)) {
    return { error: ActionErrorCode.unexpected };
  }

  const { data: existing } = await supabase
    .from("studio_projects")
    .select("id, character_reference_image_storage_path")
    .eq("id", projectId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!existing) return { error: ActionErrorCode.unexpected };

  const body = Buffer.from(await file.arrayBuffer());

  const prevPath = existing.character_reference_image_storage_path;
  if (prevPath) {
    try {
      await deleteCharacterReference(prevPath);
    } catch {
      /* best effort */
    }
  }

  const upload = await uploadCharacterReference({
    organizationId: auth.ctx.organizationId,
    projectId,
    body,
    contentType: file.type || "image/jpeg",
  });

  const { error } = await supabase
    .from("studio_projects")
    .update({
      character_reference_image_url: upload.publicUrl,
      character_reference_image_storage_path: upload.storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: ActionErrorCode.unexpected };

  revalidatePath("/dashboard/productions");
  return { ok: true, projectId };
}

export async function deleteStudioProjectReferenceImage(
  _prev: StudioProjectActionState,
  formData: FormData,
): Promise<StudioProjectActionState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) return { error: ActionErrorCode.unexpected };

  const { data: existing } = await supabase
    .from("studio_projects")
    .select("id, character_reference_image_storage_path")
    .eq("id", projectId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!existing) return { error: ActionErrorCode.unexpected };

  if (existing.character_reference_image_storage_path) {
    try {
      await deleteCharacterReference(
        existing.character_reference_image_storage_path,
      );
    } catch {
      /* best effort */
    }
  }

  const { error } = await supabase
    .from("studio_projects")
    .update({
      character_reference_image_url: null,
      character_reference_image_storage_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: ActionErrorCode.unexpected };

  revalidatePath("/dashboard/productions");
  return { ok: true, projectId };
}

export async function deleteStudioProject(
  _prev: StudioProjectActionState,
  formData: FormData,
): Promise<StudioProjectActionState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) return { error: ActionErrorCode.unexpected };

  const { error } = await supabase
    .from("studio_projects")
    .delete()
    .eq("id", projectId)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: ActionErrorCode.unexpected };

  revalidatePath("/dashboard/productions");
  return { ok: true };
}
