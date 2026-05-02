import { NextResponse } from "next/server";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";
import { createAdminClient } from "@/lib/supabase/admin";

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function createDailySnapshotRun(triggerType: "api" | "scheduled") {
  const admin = createAdminClient();
  const now = new Date();
  const dateKey = utcDateKey(now);
  const dayStartIso = `${dateKey}T00:00:00.000Z`;
  const dayEndIso = `${dateKey}T23:59:59.999Z`;

  const existing = await admin
    .from("content_runs")
    .select("id")
    .eq("run_type", "review_gate")
    .contains("metadata", { snapshot_kind: "daily_ops" })
    .gte("created_at", dayStartIso)
    .lte("created_at", dayEndIso)
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) {
    return { skipped: true, runId: existing.data.id, dateKey };
  }

  const [itemsRes, runsRes] = await Promise.all([
    admin
      .from("content_items")
      .select("id,type,title,status,created_at,updated_at,review_notes,metadata")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("content_runs")
      .select("run_type,status,created_at,error_summary,metadata")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (itemsRes.error) {
    throw new Error(`daily_snapshot_items_query_failed:${itemsRes.error.message}`);
  }
  if (runsRes.error) {
    throw new Error(`daily_snapshot_runs_query_failed:${runsRes.error.message}`);
  }

  const snapshot = buildContentQualitySnapshot({
    items: (itemsRes.data ?? []) as never[],
    runs: (runsRes.data ?? []) as never[],
    windowDays: 7,
    freshWindowHours: 24,
  });

  const inserted = await admin
    .from("content_runs")
    .insert({
      run_type: "review_gate",
      status: "succeeded",
      trigger_type: triggerType,
      started_at: now.toISOString(),
      ended_at: now.toISOString(),
      metadata: {
        snapshot_kind: "daily_ops",
        daily_snapshot: {
          generated_at: now.toISOString(),
          date_key: dateKey,
          generated_count: snapshot.generatedCount,
          published_count: snapshot.publishedCount,
          review_required_count: snapshot.reviewRequiredCount,
          send_failed_count: snapshot.sendFailedCount,
          deferred_count: snapshot.deferredCount,
          avg_quality_score: snapshot.avgQualityScore,
          citation_coverage_7d_avg: snapshot.citationCoverage7dAvg,
          citation_coverage_24h_avg: snapshot.citationCoverage24hAvg,
          winner_strategy: snapshot.winnerStrategy,
        },
      },
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data?.id) {
    throw new Error(`daily_snapshot_insert_failed:${inserted.error?.message ?? "unknown"}`);
  }

  return { skipped: false, runId: inserted.data.id, dateKey };
}

export async function POST(req: Request) {
  const automationToken = process.env.CONTENT_OPS_AUTOMATION_TOKEN?.trim();
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (!automationToken || auth !== `Bearer ${automationToken}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await createDailySnapshotRun("api");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const automationToken = process.env.CONTENT_OPS_AUTOMATION_TOKEN?.trim();
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const cronHeader = req.headers.get("x-vercel-cron");
  const tokenAuthorized = automationToken ? token === automationToken : false;
  const trustedCron = Boolean(cronHeader);
  if (!tokenAuthorized && !trustedCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await createDailySnapshotRun("scheduled");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
