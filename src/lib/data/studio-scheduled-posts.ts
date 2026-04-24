import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StudioScheduledPostRow =
  Database["public"]["Tables"]["studio_scheduled_posts"]["Row"];

export async function listScheduledPostsForEpisode(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  episodeId: string,
): Promise<StudioScheduledPostRow[]> {
  const { data, error } = await supabase
    .from("studio_scheduled_posts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("episode_id", episodeId)
    .order("scheduled_at", { ascending: true });
  if (error) {
    if (
      error.code === "PGRST205" &&
      typeof error.message === "string" &&
      error.message.includes("studio_scheduled_posts")
    ) {
      // Local / preview DB without migration 041 applied.
      return [];
    }
    throw error;
  }
  return data ?? [];
}
