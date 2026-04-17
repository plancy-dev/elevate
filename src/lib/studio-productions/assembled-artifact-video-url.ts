import { createAdminClient } from "@/lib/supabase/admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import { parseSupabaseStoragePublicUrl } from "@/lib/studio-productions/content-storage-public-url";
import type { Json } from "@/types/database.types";

function asMetadataRecord(m: Json | null): Record<string, unknown> {
  if (m && typeof m === "object" && !Array.isArray(m)) {
    return m as Record<string, unknown>;
  }
  return {};
}

/**
 * Resolves the Storage object path for an assembled MP4 (private bucket),
 * using artifact metadata or the public URL shape.
 */
export function resolveAssembledVideoStorageObjectPath(
  externalUrl: string,
  metadata: Json | null,
): string | null {
  const raw = externalUrl.trim();
  if (!raw || raw.startsWith("data:")) return null;

  const expectedBucket = getContentStorageBucket();
  const meta = asMetadataRecord(metadata);
  const metaPath =
    typeof meta.content_storage_path === "string"
      ? meta.content_storage_path.trim()
      : "";

  if (metaPath) {
    return metaPath.startsWith("studio-assembled/") ? metaPath : null;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const parsed = parseSupabaseStoragePublicUrl(raw);
    if (parsed?.bucket === expectedBucket && parsed.objectPath.startsWith("studio-assembled/")) {
      return parsed.objectPath;
    }
  }

  return null;
}

/**
 * Short-lived signed URL for reading an assembled video from Storage (playback or server-side fetch).
 */
export async function createSignedUrlForAssembledVideoPath(
  objectPath: string,
  expiresInSeconds: number,
): Promise<string | null> {
  const bucket = getContentStorageBucket();
  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds);
  if (error || !signed?.signedUrl) return null;
  return signed.signedUrl;
}
