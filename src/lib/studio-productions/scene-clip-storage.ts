import { createAdminClient } from "@/lib/supabase/admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";

export function buildSceneClipUploadStoragePath(opts: {
  organizationId: string;
  episodeId: string;
  sceneIndex: number;
  fileId: string;
}): string {
  return `studio-scene-clips/${opts.organizationId}/${opts.episodeId}/scene-${opts.sceneIndex}-${opts.fileId}.mp4`;
}

export type UploadSceneClipResult = {
  publicUrl: string;
  storagePath: string;
};

export async function uploadSceneClipToContentStorage(opts: {
  organizationId: string;
  episodeId: string;
  sceneIndex: number;
  body: Buffer;
  contentType: string;
}): Promise<UploadSceneClipResult> {
  const admin = createAdminClient();
  const bucket = getContentStorageBucket();
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = buildSceneClipUploadStoragePath({
    organizationId: opts.organizationId,
    episodeId: opts.episodeId,
    sceneIndex: opts.sceneIndex,
    fileId,
  });
  const { error } = await admin.storage.from(bucket).upload(path, opts.body, {
    contentType: opts.contentType || "video/mp4",
    upsert: true,
  });
  if (error) {
    throw new Error(error.message);
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path };
}
