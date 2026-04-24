/**
 * Helpers for loading scene keyframe artifacts (candidates + first/last) for
 * an episode. Server-only usage (called from RSC route handler or data layer).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import {
  parseSceneKeyframeMetadata,
  type SceneKeyframeMetadata,
} from "@/lib/studio-productions/scene-keyframe-metadata";
import type { StudioSceneKeyframeRole } from "@/lib/studio-productions/artifact-roles";
import { STUDIO_SCENE_KEYFRAME_ROLES } from "@/lib/studio-productions/artifact-roles";

export type SceneKeyframeArtifact = {
  id: string;
  role: StudioSceneKeyframeRole;
  externalUrl: string | null;
  toolPlatform: string;
  createdAt: string;
  metadata: SceneKeyframeMetadata;
};

export type SceneKeyframeSlots = {
  first: SceneKeyframeArtifact | null;
  last: SceneKeyframeArtifact | null;
  candidates: SceneKeyframeArtifact[];
};

export async function loadSceneKeyframeArtifacts(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  episodeId: string,
): Promise<Map<number, SceneKeyframeSlots>> {
  const { data, error } = await supabase
    .from("studio_production_artifacts")
    .select("id, artifact_role, external_url, tool_platform, created_at, metadata")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .in("artifact_role", STUDIO_SCENE_KEYFRAME_ROLES as unknown as string[])
    .order("created_at", { ascending: true });

  if (error) throw error;

  const byScene = new Map<number, SceneKeyframeSlots>();

  for (const row of data ?? []) {
    const meta = parseSceneKeyframeMetadata(row.metadata as Json);
    if (!meta) continue;
    if (
      row.artifact_role !== "scene_keyframe_candidate" &&
      row.artifact_role !== "scene_keyframe_first" &&
      row.artifact_role !== "scene_keyframe_last"
    ) {
      continue;
    }
    const record: SceneKeyframeArtifact = {
      id: row.id,
      role: row.artifact_role,
      externalUrl: row.external_url,
      toolPlatform: row.tool_platform,
      createdAt: row.created_at,
      metadata: meta,
    };
    const slot = byScene.get(meta.scene_index) ?? {
      first: null,
      last: null,
      candidates: [],
    };
    if (row.artifact_role === "scene_keyframe_first") {
      slot.first = record;
    } else if (row.artifact_role === "scene_keyframe_last") {
      slot.last = record;
    } else {
      slot.candidates.push(record);
    }
    byScene.set(meta.scene_index, slot);
  }

  return byScene;
}
