/**
 * Supabase Storage path + uploader for Master Reference Images (ADR-009 §5).
 *
 * Bucket: same as the rest of studio content (content-storage bucket helper).
 * Path: `studio-character-refs/{organizationId}/{projectId}-{fileId}.{ext}`.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";

function extFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export function buildCharacterReferenceStoragePath(opts: {
  organizationId: string;
  projectId: string;
  fileId: string;
  mimeType: string;
}): string {
  const ext = extFor(opts.mimeType);
  return `studio-character-refs/${opts.organizationId}/${opts.projectId}-${opts.fileId}.${ext}`;
}

export type UploadCharacterReferenceResult = {
  publicUrl: string;
  storagePath: string;
};

export async function uploadCharacterReference(opts: {
  organizationId: string;
  projectId: string;
  body: Buffer;
  contentType: string;
}): Promise<UploadCharacterReferenceResult> {
  const admin = createAdminClient();
  const bucket = getContentStorageBucket();
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = buildCharacterReferenceStoragePath({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
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

export async function deleteCharacterReference(storagePath: string): Promise<void> {
  const admin = createAdminClient();
  const bucket = getContentStorageBucket();
  await admin.storage.from(bucket).remove([storagePath]);
}
