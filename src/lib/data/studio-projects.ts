import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StudioProjectRow =
  Database["public"]["Tables"]["studio_projects"]["Row"];

export async function listStudioProjectsForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<StudioProjectRow[]> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    // Local / preview DB without migration 033: avoid crashing the whole hub.
    if (
      error.code === "PGRST205" &&
      typeof error.message === "string" &&
      error.message.includes("studio_projects")
    ) {
      return [];
    }
    throw error;
  }
  return data ?? [];
}

export async function getStudioProjectBySlug(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  slug: string,
): Promise<StudioProjectRow | null> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getStudioProjectById(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  projectId: string,
): Promise<StudioProjectRow | null> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
