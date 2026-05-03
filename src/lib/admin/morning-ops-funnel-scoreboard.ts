import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Rolling-window UTC ISO timestamp for `since` filters (tests may pin `nowMs`). */
export function rollingSinceIso(nowMs: number, days: number): string {
  return new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
}

export type MorningOpsFunnelScoreboard = {
  waitlist: { last7d: number; last30d: number; allTime: number };
  catalogEntitlements: { rowsLast7d: number; rowsLast30d: number; allRows: number };
  promptStudioBeta: { allowlistTotal: number; addedLast7d: number; addedLast30d: number };
  generatedAtUtc: string;
};

async function countSince(
  admin: SupabaseClient<Database>,
  table: "waitlist_signups" | "organization_content_entitlements" | "prompt_studio_beta_allowlist",
  column: "created_at" | "granted_at",
  sinceIso: string,
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(column, sinceIso);
  if (error) throw new Error(`${table}_count_since:${error.message}`);
  return count ?? 0;
}

async function countAll(
  admin: SupabaseClient<Database>,
  table: "waitlist_signups" | "organization_content_entitlements" | "prompt_studio_beta_allowlist",
): Promise<number> {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}_count_all:${error.message}`);
  return count ?? 0;
}

/**
 * ADR-012 Phase 1: Supabase-only funnel snapshot for operators (no PostHog server API).
 */
export async function buildMorningOpsFunnelScoreboard(
  admin: SupabaseClient<Database>,
  options?: { nowMs?: number },
): Promise<MorningOpsFunnelScoreboard> {
  const nowMs = options?.nowMs ?? Date.now();
  const since7 = rollingSinceIso(nowMs, 7);
  const since30 = rollingSinceIso(nowMs, 30);
  const generatedAtUtc = new Date(nowMs).toISOString();

  const [
    waitlist7,
    waitlist30,
    waitlistAll,
    ent7,
    ent30,
    entAll,
    beta7,
    beta30,
    betaAll,
  ] = await Promise.all([
    countSince(admin, "waitlist_signups", "created_at", since7),
    countSince(admin, "waitlist_signups", "created_at", since30),
    countAll(admin, "waitlist_signups"),
    countSince(admin, "organization_content_entitlements", "granted_at", since7),
    countSince(admin, "organization_content_entitlements", "granted_at", since30),
    countAll(admin, "organization_content_entitlements"),
    countSince(admin, "prompt_studio_beta_allowlist", "created_at", since7),
    countSince(admin, "prompt_studio_beta_allowlist", "created_at", since30),
    countAll(admin, "prompt_studio_beta_allowlist"),
  ]);

  return {
    waitlist: { last7d: waitlist7, last30d: waitlist30, allTime: waitlistAll },
    catalogEntitlements: {
      rowsLast7d: ent7,
      rowsLast30d: ent30,
      allRows: entAll,
    },
    promptStudioBeta: {
      allowlistTotal: betaAll,
      addedLast7d: beta7,
      addedLast30d: beta30,
    },
    generatedAtUtc,
  };
}
