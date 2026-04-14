/**
 * Persist Runway text-to-video output as a production artifact (server-only).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { STUDIO_CONTENT_TEXT_MAX } from "@/lib/studio-productions/constants";

export async function insertRunwayRenderArtifact(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  episodeId: string,
  params: {
    taskId: string;
    outputUrls: string[];
    /** Short human-readable line stored in content_text. */
    summaryLine: string;
    duration: number;
    ratio: string;
    model: string;
  },
): Promise<boolean> {
  const { data: maxRows } = await supabase
    .from("studio_production_artifacts")
    .select("sort_order")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (maxRows?.[0]?.sort_order ?? -1) + 1;
  const primaryUrl = params.outputUrls[0] ?? "";
  const content = params.summaryLine.slice(0, STUDIO_CONTENT_TEXT_MAX);

  const { error } = await supabase.from("studio_production_artifacts").insert({
    organization_id: organizationId,
    episode_id: episodeId,
    artifact_role: "render_output",
    tool_platform: "runway",
    content_text: content,
    external_url: primaryUrl.length > 0 ? primaryUrl : null,
    metadata: {
      source: "runway_api",
      model: params.model,
      runway_task_id: params.taskId,
      output_urls: params.outputUrls,
      ratio: params.ratio,
      duration: params.duration,
    } as Json,
    sort_order: nextOrder,
  });

  return !error;
}
