"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type StudioProjectActionState = {
  ok?: boolean;
  error?: string;
  projectId?: string;
  slug?: string;
} | null;

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

  const { error } = await supabase
    .from("studio_projects")
    .update(patch)
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
