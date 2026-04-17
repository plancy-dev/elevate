import { createAdminClient } from "@/lib/supabase/admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";

export function buildAssembledVideoStoragePath(
  organizationId: string,
  episodeId: string,
  jobId: string,
): string {
  return `studio-assembled/${organizationId}/${episodeId}/${jobId}.mp4`;
}

export type UploadAssembledMp4Result = {
  publicUrl: string;
  storagePath: string;
};

/**
 * Uploads assembled MP4 bytes to the content bucket and returns the public object URL.
 * The dashboard and YouTube upload resolve a signed URL server-side (see `assembled-artifact-video-url.ts`),
 * so the bucket does not need to be publicly readable.
 */
export async function uploadAssembledMp4ToContentStorage(opts: {
  organizationId: string;
  episodeId: string;
  jobId: string;
  body: Buffer;
}): Promise<UploadAssembledMp4Result> {
  const admin = createAdminClient();
  const bucket = getContentStorageBucket();
  const path = buildAssembledVideoStoragePath(
    opts.organizationId,
    opts.episodeId,
    opts.jobId,
  );
  const { error } = await admin.storage.from(bucket).upload(path, opts.body, {
    contentType: "video/mp4",
    upsert: true,
  });
  if (error) {
    throw new Error(error.message);
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path };
}
