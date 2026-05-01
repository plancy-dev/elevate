import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";

dotenv.config({ path: ".env.local" });

async function main() {
  const admin = createAdminClient();
  const windowDays = Number.parseInt(process.argv[2] ?? "7", 10) || 7;

  const [itemsRes, runsRes] = await Promise.all([
    admin
      .from("content_items")
      .select("id,type,title,status,created_at,updated_at,review_notes,metadata")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("content_runs")
      .select("run_type,status,created_at,error_summary,metadata")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (itemsRes.error) {
    throw new Error(`content_items_query_failed:${itemsRes.error.message}`);
  }
  if (runsRes.error) {
    throw new Error(`content_runs_query_failed:${runsRes.error.message}`);
  }

  const snapshot = buildContentQualitySnapshot({
    items: (itemsRes.data ?? []) as never[],
    runs: (runsRes.data ?? []) as never[],
    windowDays,
  });
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error("[content-ops-quality-monitor] failed:", error);
  process.exit(1);
});

