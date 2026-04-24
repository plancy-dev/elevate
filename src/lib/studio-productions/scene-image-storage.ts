/**
 * Supabase Storage path + uploader for scene keyframe images (ADR-009 §3).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";

function extFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export function buildSceneImageStoragePath(opts: {
  organizationId: string;
  episodeId: string;
  sceneIndex: number;
  fileId: string;
  mimeType: string;
}): string {
  const ext = extFor(opts.mimeType);
  return `studio-scene-images/${opts.organizationId}/${opts.episodeId}/scene-${opts.sceneIndex}-${opts.fileId}.${ext}`;
}

export type UploadSceneImageResult = {
  publicUrl: string;
  storagePath: string;
};

export async function uploadSceneImageToContentStorage(opts: {
  organizationId: string;
  episodeId: string;
  sceneIndex: number;
  body: Buffer;
  contentType: string;
}): Promise<UploadSceneImageResult> {
  const admin = createAdminClient();
  const bucket = getContentStorageBucket();
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = buildSceneImageStoragePath({
    organizationId: opts.organizationId,
    episodeId: opts.episodeId,
    sceneIndex: opts.sceneIndex,
    fileId,
    mimeType: opts.contentType,
  });
  const { error } = await admin.storage.from(bucket).upload(path, opts.body, {
    contentType: opts.contentType || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path };
}

export async function deleteSceneImageFromStorage(storagePath: string): Promise<void> {
  const admin = createAdminClient();
  const bucket = getContentStorageBucket();
  await admin.storage.from(bucket).remove([storagePath]);
}
