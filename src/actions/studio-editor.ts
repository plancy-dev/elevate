"use server";

import { revalidatePath } from "next/cache";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { parseEditorDslV3 } from "@/lib/studio-productions/editor-dsl";
import { readEditorDslFromPipelinePrefs } from "@/lib/studio-productions/editor-dsl-storage";
import {
  mergePipelinePrefsPatch,
  validatePipelinePrefsJsonSize,
} from "@/lib/studio-productions/episode-pipeline-prefs";
import type { Json } from "@/types/database.types";

export type SaveEditorDslState = {
  ok?: boolean;
  error?: string;
  /** Server's last-known updatedAt; returned on stale saves so the client can reconcile. */
  serverUpdatedAt?: string;
} | null;


/**
 * Persist the editor DSL into `episode.pipeline_prefs.editor`. Uses
 * last-write-wins reconciliation on `updatedAt`: if the server copy is
 * newer, we reject the save so the client can reload and rebase.
 */
export async function saveEditorDsl(
  _prev: SaveEditorDslState,
  formData: FormData,
): Promise<SaveEditorDslState> {
  void _prev;

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const payload = String(formData.get("dsl") ?? "");
  if (!episodeId || !payload) {
    return { error: ActionErrorCode.unexpected };
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(payload);
  } catch {
    return { error: ActionErrorCode.studioEditorDslInvalid };
  }
  const dsl = parseEditorDslV3(parsedRaw);
  if (!dsl) return { error: ActionErrorCode.studioEditorDslInvalid };
  if (dsl.episodeId !== episodeId) {
    return { error: ActionErrorCode.studioEditorDslEpisodeMismatch };
  }

  const { data: row, error: fetchError } = await supabase
    .from("studio_production_episodes")
    .select("pipeline_prefs")
    .eq("id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (fetchError) return { error: ActionErrorCode.dbError };
  if (!row) return { error: ActionErrorCode.studioEpisodeNotFound };

  const serverDsl = readEditorDslFromPipelinePrefs(
    row.pipeline_prefs ?? null,
  );
  if (serverDsl && serverDsl.updatedAt > dsl.updatedAt) {
    return {
      error: ActionErrorCode.studioEditorSaveStale,
      serverUpdatedAt: serverDsl.updatedAt,
    };
  }

  const patch: Json = { editor: dsl as unknown as Json };
  const merged = mergePipelinePrefsPatch(
    (row.pipeline_prefs ?? {}) as Json,
    patch,
  );
  const sizeOk = validatePipelinePrefsJsonSize(merged);
  if (!sizeOk.ok) {
    return { error: ActionErrorCode.studioEditorDslTooLarge };
  }

  const { error: updateError } = await supabase
    .from("studio_production_episodes")
    .update({
      pipeline_prefs: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId)
    .eq("organization_id", auth.ctx.organizationId);
  if (updateError) return { error: ActionErrorCode.dbError };

  revalidatePath(`/dashboard/productions/${episodeId}/editor`);
  return { ok: true, serverUpdatedAt: dsl.updatedAt };
}

