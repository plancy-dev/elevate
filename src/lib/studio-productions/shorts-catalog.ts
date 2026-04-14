import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StudioNicheRow = Database["public"]["Tables"]["studio_niches"]["Row"];
export type StudioDistributionChannelRow =
  Database["public"]["Tables"]["studio_distribution_channels"]["Row"];

/** Flattened template row for “pick format” UI (niche shown per option). */
export type StudioFormatTemplateOption = {
  id: string;
  display_name: string;
  slug: string;
  hook_structure: string;
  script_prompt_shell: string;
  target_duration_seconds: number | null;
  sort_order: number;
  niche_id: string;
  niche_slug: string;
  niche_display_name: string;
  pack_slug: string;
};

export type StudioShortsCatalog = {
  niches: StudioNicheRow[];
  templateOptions: StudioFormatTemplateOption[];
  channels: StudioDistributionChannelRow[];
};

export async function listStudioNichesActive(
  supabase: SupabaseClient<Database>,
): Promise<StudioNicheRow[]> {
  const { data, error } = await supabase
    .from("studio_niches")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StudioNicheRow[];
}

export async function listStudioDistributionChannelsForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<StudioDistributionChannelRow[]> {
  const { data, error } = await supabase
    .from("studio_distribution_channels")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StudioDistributionChannelRow[];
}

/**
 * Niches, format templates (with niche labels), and org channels for new-episode wizard.
 */
export async function listStudioShortsCatalogForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<StudioShortsCatalog> {
  const [niches, channels, templatesRaw, packsRaw] = await Promise.all([
    listStudioNichesActive(supabase),
    listStudioDistributionChannelsForOrg(supabase, organizationId),
    supabase
      .from("studio_format_templates")
      .select(
        "id, display_name, slug, hook_structure, script_prompt_shell, target_duration_seconds, sort_order, format_pack_id",
      )
      .eq("is_active", true),
    supabase
      .from("studio_format_packs")
      .select("id, slug, studio_niche_id")
      .eq("is_active", true),
  ]);

  if (templatesRaw.error) throw templatesRaw.error;
  if (packsRaw.error) throw packsRaw.error;

  const packs = packsRaw.data ?? [];
  const packById = new Map(packs.map((p) => [p.id, p]));
  const nicheById = new Map(niches.map((n) => [n.id, n]));

  const templateOptions: StudioFormatTemplateOption[] = [];
  for (const row of templatesRaw.data ?? []) {
    const pack = packById.get(row.format_pack_id);
    if (!pack) continue;
    const niche = nicheById.get(pack.studio_niche_id);
    if (!niche) continue;
    templateOptions.push({
      id: row.id,
      display_name: row.display_name,
      slug: row.slug,
      hook_structure: row.hook_structure,
      script_prompt_shell: row.script_prompt_shell,
      target_duration_seconds: row.target_duration_seconds,
      sort_order: row.sort_order,
      niche_id: niche.id,
      niche_slug: niche.slug,
      niche_display_name: niche.display_name,
      pack_slug: pack.slug,
    });
  }

  templateOptions.sort((a, b) => {
    const n = a.niche_display_name.localeCompare(b.niche_display_name, "ko");
    if (n !== 0) return n;
    return a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name, "ko");
  });

  return { niches, templateOptions, channels };
}
