/**
 * Reject duplicate draft/review_required rows per (type, normalized title).
 * Keeps best review_gate qualityScore, then newest updated_at.
 *
 * pnpm exec tsx scripts/content-ops-queue-dedupe-by-title.ts
 */
import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

dotenv.config({ path: ".env.local", quiet: true });

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function readQualityScore(metadata: Json | null): number {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const root = metadata as Record<string, unknown>;
  const latest =
    (root.review_gate as Record<string, unknown> | undefined)?.latest ??
    (root.reviewGate as Record<string, unknown> | undefined)?.latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return 0;
  const metrics = (latest as Record<string, unknown>).metrics;
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return 0;
  const q = Number((metrics as Record<string, unknown>).qualityScore);
  return Number.isFinite(q) ? q : 0;
}

type Row = {
  id: string;
  type: string;
  title: string;
  status: string;
  updated_at: string;
  metadata: Json | null;
};

async function main() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_items")
    .select("id, type, title, status, updated_at, metadata")
    .in("status", ["draft", "review_required"])
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];

  const byKey = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.type}:${normalizeTitle(r.title ?? "")}`;
    if (!normalizeTitle(r.title ?? "")) continue;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }

  const rejectIds: string[] = [];
  for (const [, group] of byKey) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => {
      const qd = readQualityScore(b.metadata) - readQualityScore(a.metadata);
      if (qd !== 0) return qd;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    for (const loser of sorted.slice(1)) {
      rejectIds.push(loser.id);
    }
  }

  if (rejectIds.length === 0) {
    console.log(JSON.stringify({ deduped: 0, message: "no duplicate title groups" }, null, 2));
    return;
  }

  const now = new Date().toISOString();
  const { error: upErr } = await admin
    .from("content_items")
    .update({
      status: "rejected",
      updated_at: now,
      review_notes: "dedupe:duplicate_title_keep_best_quality",
    })
    .in("id", rejectIds);

  if (upErr) throw new Error(upErr.message);

  console.log(
    JSON.stringify(
      {
        rejectedCount: rejectIds.length,
        rejectedIds: rejectIds,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("[content-ops-queue-dedupe-by-title] failed:", e);
  process.exit(1);
});
