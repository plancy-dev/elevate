"use server";

import { revalidatePath } from "next/cache";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import {
  dslToAssemblyJobInput,
  parseEditorDslV3,
} from "@/lib/studio-productions/editor-dsl";
import type { Json } from "@/types/database.types";

export type ExportEditorState = {
  ok?: boolean;
  error?: string;
  jobId?: string;
} | null;

/**
 * Enqueue a `studio_video_assembly_jobs` row using the editor DSL v3.
 * The worker (workers/video-assembly) picks this up like any other job.
 */
export async function exportEditorToAssembly(
  _prev: ExportEditorState,
  formData: FormData,
): Promise<ExportEditorState> {
  void _prev;

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const payload = String(formData.get("dsl") ?? "");
  if (!episodeId || !payload) {
    return { error: ActionErrorCode.unexpected };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { error: ActionErrorCode.studioEditorDslInvalid };
  }
  const dsl = parseEditorDslV3(raw);
  if (!dsl) return { error: ActionErrorCode.studioEditorDslInvalid };
  if (dsl.episodeId !== episodeId) {
    return { error: ActionErrorCode.studioEditorDslEpisodeMismatch };
  }

  // Every scene in the DSL must have a rendered source URL. Otherwise the
  // worker would just skip/blank that slot; better to stop the user here.
  const renderable = dsl.scenes.filter((s) => s.sourceUrl.length > 0);
  if (renderable.length === 0) {
    return { error: ActionErrorCode.studioEditorNoRenderableScenes };
  }

  // Pick the latest narration audio + subtitle artifacts to pass to the
  // worker. The DSL already carries a narration URL but we prefer the DB
  // copy so the worker output stays in sync with upstream pipeline edits.
  const { data: audioRow } = await supabase
    .from("studio_production_artifacts")
    .select("external_url")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "tts_audio")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: srtRow } = await supabase
    .from("studio_production_artifacts")
    .select("content_text")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "subtitle_srt")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const jobInput = dslToAssemblyJobInput(
    dsl,
    audioRow?.external_url ?? null,
    srtRow?.content_text ?? null,
  );

  const { data: inserted, error: insertError } = await supabase
    .from("studio_video_assembly_jobs")
    .insert({
      organization_id: auth.ctx.organizationId,
      episode_id: episodeId,
      input: jobInput as unknown as Json,
      status: "pending",
      created_by: auth.ctx.userId,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: ActionErrorCode.dbError };
  }

  revalidatePath(`/dashboard/productions/${episodeId}`);
  revalidatePath(`/dashboard/productions/${episodeId}/editor`);
  return { ok: true, jobId: inserted.id };
}
