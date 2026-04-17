"use server";

import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import {
  mergePipelinePrefsPatch,
  validatePipelinePrefsJsonSize,
} from "@/lib/studio-productions/episode-pipeline-prefs";
import type { Json } from "@/types/database.types";

export type SaveEpisodePipelinePrefsResult =
  | { ok: true; error?: undefined }
  | { ok?: undefined; error: string };

/**
 * Merge-save UI-only pipeline preferences on the episode row (scene JSON, model picks, etc.).
 * Editors only; viewers receive `authInsufficientPermissions`.
 */
export async function saveEpisodePipelinePrefs(
  episodeId: string,
  patch: Json,
): Promise<SaveEpisodePipelinePrefsResult> {
  const id = episodeId.trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: row, error: fetchError } = await supabase
    .from("studio_production_episodes")
    .select("pipeline_prefs, organization_id")
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();

  if (fetchError) return { error: ActionErrorCode.dbError };
  if (!row) return { error: ActionErrorCode.studioEpisodeNotFound };

  const base = (row.pipeline_prefs ?? {}) as Json;
  const merged = mergePipelinePrefsPatch(base, patch);
  const sizeOk = validatePipelinePrefsJsonSize(merged);
  if (!sizeOk.ok) return { error: sizeOk.error };

  if (process.env.NODE_ENV === "development") {
    try {
      console.info("[saveEpisodePipelinePrefs]", id, JSON.stringify(patch));
    } catch {
      console.info("[saveEpisodePipelinePrefs]", id, String(patch));
    }
  }

  if (JSON.stringify(merged) === JSON.stringify(base)) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("studio_production_episodes")
    .update({
      pipeline_prefs: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId);

  if (updateError) return { error: ActionErrorCode.dbError };

  return { ok: true };
}
