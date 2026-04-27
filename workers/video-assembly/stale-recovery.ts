import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StaleRecoverySummary = {
  requeuedCount: number;
  failedCount: number;
};

type ResetRpcRow = {
  requeued_count?: number | null;
  failed_count?: number | null;
};

export async function resetStaleVideoAssemblyJobs(
  admin: SupabaseClient<Database>,
  staleMinutes: number,
): Promise<StaleRecoverySummary> {
  const { data, error } = await admin.rpc(
    "reset_stale_studio_video_assembly_jobs",
    {
      stale_before: `${Math.max(1, Math.floor(staleMinutes))} minutes`,
    },
  );
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : null) as ResetRpcRow | null;
  return {
    requeuedCount: Number(row?.requeued_count ?? 0),
    failedCount: Number(row?.failed_count ?? 0),
  };
}
