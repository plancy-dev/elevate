"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import {
  createSignedUrlForAssembledVideoPath,
  resolveAssembledVideoStorageObjectPath,
} from "@/lib/studio-productions/assembled-artifact-video-url";

export type AssembledVideoPlaybackResult =
  | { ok: true; playbackUrl: string }
  | { ok: false; error: string };

const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Returns a URL the browser can use in `<video src>` for an assembled_video artifact.
 * Uses a short-lived signed URL when the file lives in private Supabase Storage (public URLs 403).
 */
export async function getAssembledVideoPlaybackUrl(
  artifactId: string,
): Promise<AssembledVideoPlaybackResult> {
  const trimmed = artifactId.trim();
  if (!trimmed) return { ok: false, error: "invalid_artifact" };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: artifact, error } = await supabase
    .from("studio_production_artifacts")
    .select("id, artifact_role, organization_id, external_url, metadata")
    .eq("id", trimmed)
    .maybeSingle();

  if (error || !artifact) return { ok: false, error: "not_found" };
  if (artifact.artifact_role !== "assembled_video") {
    return { ok: false, error: "invalid_artifact" };
  }
  if (artifact.organization_id !== auth.ctx.organizationId) {
    return { ok: false, error: "forbidden" };
  }

  const raw = artifact.external_url?.trim() ?? "";
  if (!raw) return { ok: false, error: "no_url" };

  if (raw.startsWith("data:video")) {
    return { ok: true, playbackUrl: raw };
  }

  const objectPath = resolveAssembledVideoStorageObjectPath(raw, artifact.metadata);
  if (objectPath) {
    const signed = await createSignedUrlForAssembledVideoPath(
      objectPath,
      SIGNED_URL_TTL_SECONDS,
    );
    if (!signed) return { ok: false, error: "sign_failed" };
    return { ok: true, playbackUrl: signed };
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return { ok: true, playbackUrl: raw };
  }

  return { ok: false, error: "could_not_resolve_storage" };
}
