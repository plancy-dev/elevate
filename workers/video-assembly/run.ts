/**
 * Polls `studio_video_assembly_jobs`, claims work via `claim_studio_video_assembly_job`,
 * runs FFmpeg assembly, uploads to Storage, writes artifact + job completion.
 *
 * Run from repo root: `pnpm exec tsx workers/video-assembly/run.ts`
 * Requires: ffmpeg/ffprobe on PATH, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL.
 *
 * When `PORT` is set (e.g. Fly.io), serves `GET /health` for platform checks — local dev usually has no PORT.
 */

import "./load-local-env";

import http from "node:http";

import { createAdminClient } from "@/lib/supabase/admin";
import { processVideoAssemblyJob } from "@/lib/studio-productions/process-video-assembly-job";
import { resetStaleVideoAssemblyJobs } from "./stale-recovery";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fly / containers: bind HTTP health only when PORT is set. */
function startHealthServerIfNeeded(): void {
  const raw = process.env.PORT?.trim();
  if (!raw) return;
  const port = Number.parseInt(raw, 10);
  if (!Number.isFinite(port) || port <= 0) return;

  const server = http.createServer((req, res) => {
    const path = req.url?.split("?")[0] ?? "";
    if (req.method === "GET" && path === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(port, "0.0.0.0", () => {
    console.info(`[assembly-worker] health http://0.0.0.0:${port}/health`);
  });
}

function pollMs(): number {
  const raw = process.env.WORKER_POLL_IDLE_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 200 ? n : 2500;
}

function staleMinutes(): number {
  const raw = process.env.WORKER_STALE_JOB_MINUTES?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 30;
}

function staleRecoveryEveryLoops(): number {
  const raw = process.env.WORKER_STALE_RECOVERY_EVERY_LOOPS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 10;
}

async function maybeRecoverStaleJobs(
  admin: ReturnType<typeof createAdminClient>,
  staleMin: number,
  reason: "startup" | "interval",
): Promise<void> {
  try {
    const summary = await resetStaleVideoAssemblyJobs(admin, staleMin);
    if (summary.requeuedCount > 0 || summary.failedCount > 0) {
      console.info(
        `[assembly-worker] stale-recovery(${reason}) requeued=${summary.requeuedCount} failed=${summary.failedCount}`,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[assembly-worker] stale-recovery(${reason}) failed:`, msg);
  }
}

async function failJobCrash(
  admin: ReturnType<typeof createAdminClient>,
  jobId: string,
  message: string,
): Promise<void> {
  const trimmed = message.trim().slice(0, 2000);
  await admin
    .from("studio_video_assembly_jobs")
    .update({
      status: "failed",
      error_message: trimmed || "worker_crash",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function runPollLoop(): Promise<void> {
  const admin = createAdminClient();
  const idle = pollMs();
  const staleMin = staleMinutes();
  const recoveryEvery = staleRecoveryEveryLoops();
  console.info(`[assembly-worker] poll loop started (idle ${idle}ms)`);
  console.info(
    `[assembly-worker] stale recovery: threshold=${staleMin}m every=${recoveryEvery} loops`,
  );

  await maybeRecoverStaleJobs(admin, staleMin, "startup");
  let loop = 0;

  for (;;) {
    loop += 1;
    if (loop % recoveryEvery === 0) {
      await maybeRecoverStaleJobs(admin, staleMin, "interval");
    }

    const { data: rows, error } = await admin.rpc("claim_studio_video_assembly_job");
    if (error) {
      console.error("[assembly-worker] claim error:", error.message);
      await sleep(idle);
      continue;
    }
    const job = rows?.[0];
    if (!job) {
      await sleep(idle);
      continue;
    }

    try {
      await processVideoAssemblyJob(admin, job);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[assembly-worker] job failed:", job.id, msg);
      try {
        await failJobCrash(admin, job.id, msg);
      } catch (inner) {
        console.error("[assembly-worker] failJob:", inner);
      }
    }
  }
}

function main(): void {
  startHealthServerIfNeeded();
  void runPollLoop().catch((e) => {
    console.error("[assembly-worker] fatal:", e);
    process.exit(1);
  });
}

main();
