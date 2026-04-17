/**
 * `sync`: run ffmpeg in the Next.js process (needs local ffmpeg). `async`: enqueue `studio_video_assembly_jobs`
 * for the Fly/worker process (same Supabase as the app).
 *
 * Default: **async** everywhere so local `pnpm dev` matches production: no ffmpeg on the laptop; a deployed
 * worker picks up jobs. Set `STUDIO_VIDEO_ASSEMBLY_MODE=sync` for offline assembly without a worker.
 */
export type StudioVideoAssemblyMode = "sync" | "async";

export function readStudioVideoAssemblyMode(): StudioVideoAssemblyMode {
  const raw = process.env.STUDIO_VIDEO_ASSEMBLY_MODE?.trim().toLowerCase();
  if (raw === "sync" || raw === "async") {
    return raw;
  }
  return "async";
}
