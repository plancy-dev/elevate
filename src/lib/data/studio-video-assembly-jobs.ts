import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type ActiveAssemblyJobRow = {
  id: string;
  status: string;
};

export async function getLatestActiveAssemblyJobForEpisode(
  supabase: SupabaseClient<Database>,
  episodeId: string,
  organizationId: string,
): Promise<ActiveAssemblyJobRow | null> {
  const { data, error } = await supabase
    .from("studio_video_assembly_jobs")
    .select("id, status")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, status: data.status };
}
