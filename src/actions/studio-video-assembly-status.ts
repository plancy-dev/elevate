"use server";

import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { createClient } from "@/lib/supabase/server";
import { parseArtifactMetadata } from "@/lib/studio-productions/artifact-metadata-schemas";
import type { Json } from "@/types/database.types";

export type VideoAssemblyJobStatusState = {
  status: "pending" | "processing" | "completed" | "failed" | "unknown";
  errorMessage?: string | null;
  artifactId?: string | null;
  durationSeconds?: number | null;
};

/**
 * Poll assembly job status (org-scoped). Used after async enqueue.
 * Never throws: avoids Next.js Flight 500 + client `resolveErrorDev` crashes when polling.
 */
export async function getVideoAssemblyJobStatus(
  jobId: string,
): Promise<VideoAssemblyJobStatusState> {
  try {
    const id = jobId.trim();
    if (!id) return { status: "unknown" };

    const supabase = await createClient();
    const auth = await getOrgMemberContext(supabase);
    if (!auth.ok) return { status: "unknown" };

    const { data: row } = await supabase
      .from("studio_video_assembly_jobs")
      .select("status, error_message, output_artifact_id, organization_id")
      .eq("id", id)
      .maybeSingle();

    if (!row || row.organization_id !== auth.ctx.organizationId) {
      return { status: "unknown" };
    }

    let durationSeconds: number | null = null;
    if (row.output_artifact_id) {
      const { data: art } = await supabase
        .from("studio_production_artifacts")
        .select("metadata")
        .eq("id", row.output_artifact_id)
        .maybeSingle();
      const meta = parseArtifactMetadata(
        "assembled_video",
        (art?.metadata ?? null) as Json | null,
      );
      if (meta && typeof meta === "object" && meta !== null && "duration_seconds" in meta) {
        const ds = (meta as { duration_seconds?: unknown }).duration_seconds;
        durationSeconds = typeof ds === "number" ? ds : null;
      }
    }

    const st = row.status;
    if (
      st === "pending" ||
      st === "processing" ||
      st === "completed" ||
      st === "failed"
    ) {
      return {
        status: st,
        errorMessage: row.error_message,
        artifactId: row.output_artifact_id,
        durationSeconds,
      };
    }
    return { status: "unknown" };
  } catch (err) {
    console.error("[getVideoAssemblyJobStatus]", err);
    return { status: "unknown" };
  }
}
