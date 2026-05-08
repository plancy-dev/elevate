/**
 * Operator-only: list or publish `content_items` where `type=blog` and `status=approved`
 * by calling `runPublishPipeline({ contentItemId })` once per row (service role).
 *
 * Requires `.env.local` with `SUPABASE_SERVICE_ROLE_KEY` (same as other content-ops CLIs).
 *
 * pnpm run content-ops:publish-approved-blogs:dry-run
 * pnpm run content-ops:publish-approved-blogs -- --limit=50
 *
 * PR body: add `Refs #<issue>` when this run tracks a GitHub issue.
 */
import dotenv from "dotenv";
import { runPublishPipeline } from "@/lib/content-ops/pipeline-runner";
import { createAdminClient } from "@/lib/supabase/admin";

dotenv.config({ path: ".env.local", quiet: true });

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const parsedLimit = limitArg ? Number.parseInt(limitArg.split("=")[1] ?? "", 10) : NaN;
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 200;

async function main() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_items")
    .select("id,title,locale,slug,status,type,updated_at")
    .eq("type", "blog")
    .eq("status", "approved")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exit(1);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    console.log(JSON.stringify({ ok: true, dryRun, limit, matched: 0 }, null, 2));
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          limit,
          matched: rows.length,
          items: rows.map((r) => ({
            id: r.id,
            title: r.title,
            locale: r.locale,
            slug: r.slug,
            updated_at: r.updated_at,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  const results: Array<{
    id: string;
    title: string;
    processedCount: number;
    failedCount: number;
    sentCount: number;
    deferredCount: number;
    failureMessages: string[];
  }> = [];

  for (const row of rows) {
    const stats = await runPublishPipeline({ contentItemId: row.id });
    results.push({
      id: row.id,
      title: row.title,
      processedCount: stats.processedCount,
      failedCount: stats.failedCount,
      sentCount: stats.sentCount,
      deferredCount: stats.deferredCount,
      failureMessages: stats.failureMessages,
    });
  }

  console.log(JSON.stringify({ ok: true, dryRun: false, limit, count: results.length, results }, null, 2));
}

main().catch((e) => {
  console.error("[content-ops-publish-approved-blogs] failed:", e);
  process.exit(1);
});
