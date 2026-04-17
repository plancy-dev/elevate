"use client";

import { useEffect, useRef } from "react";

import {
  getVideoAssemblyJobStatus,
  type VideoAssemblyJobStatusState,
} from "@/actions/studio-video-assembly-status";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type AssemblyJobRow = Database["public"]["Tables"]["studio_video_assembly_jobs"]["Row"];

function parseRow(payload: unknown): AssemblyJobRow | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  if (typeof r.status !== "string") return null;
  return payload as AssemblyJobRow;
}

/**
 * Tracks a single `studio_video_assembly_jobs` row while it is pending/processing.
 * - Primary: Supabase Realtime `postgres_changes` (low traffic vs 2.5s server-action polling).
 * - Fallback: slower HTTP polls if Realtime is unavailable or migration 035 not applied yet.
 * - Tab hidden: longer fallback interval to reduce background noise.
 */
export function useVideoAssemblyJobTracker(opts: {
  jobId: string | null;
  /** When false, tears down listeners (e.g. job finished or user navigated away). */
  tracking: boolean;
  onCompleted: () => void;
  onFailed: (errorMessage: string | null) => void;
  onProgress: (status: "pending" | "processing") => void;
}): void {
  const optsRef = useRef(opts);

  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    if (!opts.jobId || !opts.tracking) return;
    const jobId = opts.jobId;

    let cancelled = false;
    const supabase = createClient();
    let pollIntervalId: ReturnType<typeof setInterval> | undefined;

    const clearPoll = () => {
      if (pollIntervalId !== undefined) {
        clearInterval(pollIntervalId);
        pollIntervalId = undefined;
      }
    };

    const syncFromServer = async () => {
      const o = optsRef.current;
      const id = o.jobId;
      if (!id || cancelled) return;
      let s: VideoAssemblyJobStatusState;
      try {
        s = await getVideoAssemblyJobStatus(id);
      } catch {
        // Network / server-action transport errors — keep Realtime + next poll.
        return;
      }
      if (cancelled) return;
      if (s.status === "completed") {
        o.onCompleted();
        return;
      }
      if (s.status === "failed") {
        o.onFailed(s.errorMessage ?? null);
        return;
      }
      if (s.status === "pending" || s.status === "processing") {
        o.onProgress(s.status);
      }
    };

    const applyRow = (row: AssemblyJobRow | null) => {
      const o = optsRef.current;
      if (!row) return;
      const st = row.status;
      if (st === "completed") {
        o.onCompleted();
        return;
      }
      if (st === "failed") {
        o.onFailed(row.error_message ?? null);
        return;
      }
      if (st === "pending" || st === "processing") {
        o.onProgress(st);
      }
    };

    const armPoll = () => {
      clearPoll();
      const ms =
        typeof document !== "undefined" && document.visibilityState === "hidden"
          ? 45_000
          : 12_000;
      pollIntervalId = setInterval(() => {
        void syncFromServer();
      }, ms);
    };

    void syncFromServer();
    armPoll();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncFromServer();
      }
      armPoll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const channelName = `studio-video-assembly:${jobId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "studio_video_assembly_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          applyRow(parseRow(payload.new));
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void syncFromServer();
        }
      });

    return () => {
      cancelled = true;
      clearPoll();
      document.removeEventListener("visibilitychange", onVisibility);
      void supabase.removeChannel(channel);
    };
  }, [opts.jobId, opts.tracking]);
}
