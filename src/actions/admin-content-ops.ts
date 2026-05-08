"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";
import {
  CONTENT_OPS_RUN_SEQUENCE,
  type ContentOpsRunType,
} from "@/lib/content-ops/automation-config";
import {
  buildEditorUserPayload,
  buildReviewerUserPayload,
  CONTENT_QUEUE_EDITOR_SYSTEM,
  CONTENT_QUEUE_REVIEWER_SYSTEM,
  fetchAnthropicText,
  resolveContentOpsAnthropicConfig,
  stripOuterMarkdownFence,
} from "@/lib/content-ops/claude-content-queue";
import { evaluateReviewGate } from "@/lib/content-ops/review-gate";
import { runPublishPipeline } from "@/lib/content-ops/pipeline-runner";
import {
  executeContentOpsRun,
  runContentOpsScenario,
} from "@/lib/content-ops/run-orchestrator";
import type { Json } from "@/types/database.types";
import {
  computeAutomationHeartbeat,
  type AutomationHeartbeatInputRow,
  type AutomationHeartbeatResult,
} from "@/lib/content-ops/automation-heartbeat";
import {
  buildMorningOpsFunnelScoreboard,
  type MorningOpsFunnelScoreboard,
} from "@/lib/admin/morning-ops-funnel-scoreboard";

const CONTENT_OPS_HEARTBEAT_LOOKBACK_HOURS = 168;

const ADMIN_CONTENT_ITEM_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export type AdminContentItemRow = {
  id: string;
  type: "blog" | "newsletter";
  title: string;
  locale: string;
  status: string;
  source_quality_score: number | null;
  fact_check_score: number | null;
  scheduled_at: string | null;
  metadata: Json | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminContentItemDetail = AdminContentItemRow & {
  body_markdown: string;
  summary: string | null;
};

export type AdminContentSourceRow = {
  id: string;
  name: string;
  kind: string;
  base_url: string;
  is_active: boolean;
  trust_weight: number;
  fetch_interval_minutes: number;
  updated_at: string;
};

export type AdminContentRunRow = {
  id: string;
  run_type: string;
  status: string;
  trigger_type: string;
  started_at: string | null;
  ended_at: string | null;
  error_summary: string | null;
  metadata: Json | null;
  created_at: string;
};

export type AdminNewsletterSubscriberRow = {
  id: string;
  email: string;
  status: string;
  locale: string;
  frequency_pref: string;
  consent_at: string | null;
  unsubscribe_at: string | null;
  source: string;
  created_at: string;
};

async function assertPlatformAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "unauthorized" };

  if (!canAccessElevateServiceAdmin(user.email)) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true };
}

export async function getAdminContentItem(
  id: string,
): Promise<
  { ok: true; row: AdminContentItemDetail } | { ok: false; error: string }
> {
  if (!ADMIN_CONTENT_ITEM_ID_RE.test(id)) return { ok: false, error: "invalid_id" };
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_items")
      .select(
        "id, type, title, locale, status, source_quality_score, fact_check_score, scheduled_at, metadata, review_notes, created_at, updated_at, body_markdown, summary",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "not_found" };
    return { ok: true, row: data as unknown as AdminContentItemDetail };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function saveAdminContentItemDraft(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!ADMIN_CONTENT_ITEM_ID_RE.test(id)) return;

  const title = String(formData.get("title") ?? "").trim();
  const bodyMarkdown = String(formData.get("body_markdown") ?? "");
  const summaryRaw = String(formData.get("summary") ?? "").trim();
  const reviewNotesRaw = String(formData.get("review_notes") ?? "");

  if (!title) return;

  try {
    const admin = createAdminClient();
    const { data: existing, error: loadErr } = await admin
      .from("content_items")
      .select("metadata")
      .eq("id", id)
      .maybeSingle();
    if (loadErr || !existing) return;

    const nowIso = new Date().toISOString();
    const root = ((existing.metadata ?? {}) as Record<string, unknown>) ?? {};
    const nextMetadata = {
      ...root,
      editor_manual: {
        last_saved_at: nowIso,
      },
    };

    const { error } = await admin
      .from("content_items")
      .update({
        title,
        body_markdown: bodyMarkdown,
        summary: summaryRaw.length > 0 ? summaryRaw : null,
        review_notes: reviewNotesRaw.trim().length > 0 ? reviewNotesRaw.trim() : null,
        metadata: nextMetadata as Json,
        updated_at: nowIso,
      })
      .eq("id", id);
    if (error) return;

    revalidatePath("/admin/content-queue");
    revalidatePath(`/admin/content-queue/${id}`);
  } catch (e) {
    console.error("[saveAdminContentItemDraft] failed", e);
  }
}

/**
 * Re-runs the same local {@link evaluateReviewGate} rules as batch review_gate (no LLM / no paid API).
 * Does not clear editor {@link review_notes}; gate results live in metadata.review_gate.
 */
export async function recomputeAdminContentItemReviewGate(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!ADMIN_CONTENT_ITEM_ID_RE.test(id)) return;

  try {
    const admin = createAdminClient();
    const { data: item, error: loadErr } = await admin
      .from("content_items")
      .select("id, body_markdown, metadata, status")
      .eq("id", id)
      .maybeSingle();
    if (loadErr || !item) return;

    const { count: sourceLinkCount } = await admin
      .from("content_item_source_map")
      .select("id", { count: "exact", head: true })
      .eq("content_item_id", id);

    const gateResult = evaluateReviewGate({
      bodyMarkdown: item.body_markdown ?? "",
      sourceLinkCount: sourceLinkCount ?? 0,
    });

    const nowIso = new Date().toISOString();
    const nextMetadata = {
      ...((item.metadata ?? {}) as Record<string, unknown>),
      reviewGate: {
        latest: {
          run_id: "manual_admin",
          checked_at: nowIso,
          passed: gateResult.passed,
          reasons: gateResult.reasons,
          metrics: gateResult.metrics,
        },
      },
      review_gate: {
        latest: {
          run_id: "manual_admin",
          checked_at: nowIso,
          passed: gateResult.passed,
          reasons: gateResult.reasons,
          metrics: gateResult.metrics,
        },
      },
    };

    const patch: Record<string, unknown> = {
      metadata: nextMetadata as Json,
      updated_at: nowIso,
    };
    if (
      !gateResult.passed &&
      (item.status === "draft" || item.status === "review_required")
    ) {
      patch.status = "review_required";
    }

    const { error } = await admin.from("content_items").update(patch).eq("id", id);
    if (error) return;

    revalidatePath("/admin/content-queue");
    revalidatePath(`/admin/content-queue/${id}`);
  } catch (e) {
    console.error("[recomputeAdminContentItemReviewGate] failed", e);
  }
}

export type ClaudeQueueActionState =
  | { status: "idle" }
  | {
      status: "success";
      code: "review_saved" | "revision_applied" | "chain_complete";
      truncation?: boolean;
    }
  | { status: "error"; code: string; detail?: string };

function asMetaObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readReviewGateSnapshot(metadata: Json | null): {
  passed: boolean | null;
  reasons: string[];
  qualityScore: number | null;
} {
  const root = asMetaObject(metadata);
  const rg = asMetaObject(root?.review_gate);
  const latest = asMetaObject(rg?.latest);
  if (!latest) return { passed: null, reasons: [], qualityScore: null };
  const passed =
    latest.passed === true ? true : latest.passed === false ? false : null;
  const reasonsRaw = latest.reasons;
  const reasons = Array.isArray(reasonsRaw)
    ? reasonsRaw.filter((v): v is string => typeof v === "string")
    : [];
  const metrics = asMetaObject(latest.metrics);
  const q = Number(metrics?.qualityScore);
  return {
    passed,
    reasons,
    qualityScore: Number.isFinite(q) ? q : null,
  };
}

async function claudeReviewForItemId(id: string): Promise<ClaudeQueueActionState> {
  const cfg = resolveContentOpsAnthropicConfig();
  if (!cfg) return { status: "error", code: "missing_api_key" };

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("content_items")
      .select("id, type, locale, title, summary, body_markdown, metadata, review_notes")
      .eq("id", id)
      .maybeSingle();
    if (error || !row) return { status: "error", code: "not_found" };

    const snap = readReviewGateSnapshot(row.metadata as Json);
    const { user, truncated } = buildReviewerUserPayload({
      itemType: String(row.type),
      locale: String(row.locale),
      title: String(row.title ?? ""),
      summary: row.summary ?? null,
      bodyMarkdown: String(row.body_markdown ?? ""),
      gateReasons: snap.reasons,
      gatePassed: snap.passed,
      qualityScore: snap.qualityScore,
      reviewNotes: row.review_notes ?? null,
    });

    const llm = await fetchAnthropicText({
      apiKey: cfg.apiKey,
      model: cfg.model,
      system: CONTENT_QUEUE_REVIEWER_SYSTEM,
      user,
      maxTokens: 8192,
    });
    if (!llm.ok) {
      return {
        status: "error",
        code: "anthropic_http",
        detail: `${llm.status}: ${llm.body}`,
      };
    }
    const brief = (llm.text ?? "").trim();
    if (!brief) return { status: "error", code: "empty_response" };

    const nowIso = new Date().toISOString();
    const root = asMetaObject(row.metadata as Json) ?? {};
    const prevBrief = asMetaObject(root.claude_review_brief);
    const prevLatest = asMetaObject(prevBrief?.latest);
    const nextMetadata = {
      ...root,
      claude_review_brief: {
        ...(prevBrief ?? {}),
        latest: {
          created_at: nowIso,
          model: cfg.model,
          brief_markdown: brief,
          gate_reasons: snap.reasons,
          input_truncated: truncated,
        },
        previous: prevLatest ?? null,
      },
    } as Json;

    const { error: upErr } = await admin
      .from("content_items")
      .update({
        metadata: nextMetadata,
        updated_at: nowIso,
      })
      .eq("id", id);
    if (upErr) return { status: "error", code: "db_error", detail: upErr.message };

    revalidatePath("/admin/content-queue");
    revalidatePath(`/admin/content-queue/${id}`);
    return {
      status: "success",
      code: "review_saved",
      truncation: truncated || undefined,
    };
  } catch (e) {
    console.error("[claudeReviewForItemId] failed", e);
    return { status: "error", code: "exception", detail: String(e) };
  }
}

async function claudeRevisionForItemId(id: string): Promise<ClaudeQueueActionState> {
  const cfg = resolveContentOpsAnthropicConfig();
  if (!cfg) return { status: "error", code: "missing_api_key" };

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("content_items")
      .select("id, body_markdown, metadata, status")
      .eq("id", id)
      .maybeSingle();
    if (error || !row) return { status: "error", code: "not_found" };

    const metaRoot = asMetaObject(row.metadata as Json) ?? {};
    const briefRoot = asMetaObject(metaRoot.claude_review_brief);
    const briefLatest = asMetaObject(briefRoot?.latest);
    const briefMarkdown =
      typeof briefLatest?.brief_markdown === "string" ? briefLatest.brief_markdown : "";
    if (!briefMarkdown.trim()) return { status: "error", code: "no_brief" };

    const bodyBefore = String(row.body_markdown ?? "");
    const { user, truncated } = buildEditorUserPayload({
      briefMarkdown,
      bodyMarkdown: bodyBefore,
    });

    const llm = await fetchAnthropicText({
      apiKey: cfg.apiKey,
      model: cfg.model,
      system: CONTENT_QUEUE_EDITOR_SYSTEM,
      user,
      maxTokens: 16384,
    });
    if (!llm.ok) {
      return {
        status: "error",
        code: "anthropic_http",
        detail: `${llm.status}: ${llm.body}`,
      };
    }
    const revised = stripOuterMarkdownFence(llm.text ?? "").trim();
    if (!revised) return { status: "error", code: "empty_response" };

    const nowIso = new Date().toISOString();
    const prevRev = asMetaObject(metaRoot.claude_editor_revision);
    const prevRevLatest = asMetaObject(prevRev?.latest);
    const nextMetadata = {
      ...metaRoot,
      claude_editor_revision: {
        ...(prevRev ?? {}),
        latest: {
          applied_at: nowIso,
          model: cfg.model,
          prior_body_chars: bodyBefore.length,
          new_body_chars: revised.length,
          input_truncated: truncated,
        },
        previous: prevRevLatest ?? null,
      },
    } as Json;

    const patch: Record<string, unknown> = {
      body_markdown: revised,
      metadata: nextMetadata,
      updated_at: nowIso,
    };
    if (row.status === "draft" || row.status === "review_required") {
      patch.status = "review_required";
    }

    const { error: upErr } = await admin.from("content_items").update(patch).eq("id", id);
    if (upErr) return { status: "error", code: "db_error", detail: upErr.message };

    revalidatePath("/admin/content-queue");
    revalidatePath(`/admin/content-queue/${id}`);
    return {
      status: "success",
      code: "revision_applied",
      truncation: truncated || undefined,
    };
  } catch (e) {
    console.error("[claudeRevisionForItemId] failed", e);
    return { status: "error", code: "exception", detail: String(e) };
  }
}

export async function requestClaudeContentReview(
  _prev: ClaudeQueueActionState,
  formData: FormData,
): Promise<ClaudeQueueActionState> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { status: "error", code: "forbidden" };

  const id = String(formData.get("id") ?? "").trim();
  if (!ADMIN_CONTENT_ITEM_ID_RE.test(id)) return { status: "error", code: "invalid_id" };

  return claudeReviewForItemId(id);
}

export async function applyClaudeContentRevision(
  _prev: ClaudeQueueActionState,
  formData: FormData,
): Promise<ClaudeQueueActionState> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { status: "error", code: "forbidden" };

  const id = String(formData.get("id") ?? "").trim();
  if (!ADMIN_CONTENT_ITEM_ID_RE.test(id)) return { status: "error", code: "invalid_id" };

  return claudeRevisionForItemId(id);
}

/** One request: save Claude review brief, then apply body revision from that brief (two LLM calls). */
export async function runClaudeReviewThenRevision(
  _prev: ClaudeQueueActionState,
  formData: FormData,
): Promise<ClaudeQueueActionState> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { status: "error", code: "forbidden" };

  const id = String(formData.get("id") ?? "").trim();
  if (!ADMIN_CONTENT_ITEM_ID_RE.test(id)) return { status: "error", code: "invalid_id" };

  const r1 = await claudeReviewForItemId(id);
  if (r1.status !== "success") return r1;

  const r2 = await claudeRevisionForItemId(id);
  if (r2.status === "success") {
    return {
      status: "success",
      code: "chain_complete",
      truncation: r1.truncation || r2.truncation || undefined,
    };
  }
  if (r2.status === "error") {
    const detail = [r2.code, r2.detail].filter(Boolean).join(": ");
    return {
      status: "error",
      code: "revision_failed_after_review",
      detail: detail || undefined,
    };
  }
  return { status: "error", code: "exception", detail: "unexpected_revision_state" };
}

export async function listAdminContentQueue(filters?: {
  type?: "blog" | "newsletter" | "all";
  status?: string;
}): Promise<
  { ok: true; rows: AdminContentItemRow[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    let query = admin
      .from("content_items")
      .select(
        "id, type, title, locale, status, source_quality_score, fact_check_score, scheduled_at, metadata, review_notes, created_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(300);

    if (filters?.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: (data ?? []) as unknown as AdminContentItemRow[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function updateContentItemStatus(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const id = String(formData.get("id") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();

  if (!id || !nextStatus) return;

  try {
    const nowIso = new Date().toISOString();
    const admin = createAdminClient();
    const patch: Record<string, unknown> = {
      status: nextStatus,
      updated_at: nowIso,
    };

    if (nextStatus === "scheduled") {
      const raw = String(formData.get("scheduled_at") ?? "").trim();
      patch.scheduled_at = raw ? raw : nowIso;
    }
    if (nextStatus === "published") {
      patch.published_at = nowIso;
    }

    const { error } = await admin.from("content_items").update(patch).eq("id", id);
    if (error) return;

    if (nextStatus === "publishing") {
      await runPublishPipeline({ contentItemId: id });
    }

    revalidatePath("/admin/content-queue");
    revalidatePath(`/admin/content-queue/${id}`);
    revalidatePath("/admin/runs");
    revalidatePath("/admin/subscribers");
  } catch (e) {
    console.error("[updateContentItemStatus] failed", e);
  }
}

export async function listAdminNewsSources(): Promise<
  { ok: true; rows: AdminContentSourceRow[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_sources")
      .select(
        "id, name, kind, base_url, is_active, trust_weight, fetch_interval_minutes, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: (data ?? []) as unknown as AdminContentSourceRow[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function upsertAdminNewsSource(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "rss").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim();
  const trustWeightRaw = Number.parseInt(
    String(formData.get("trust_weight") ?? "50"),
    10,
  );
  const fetchIntervalRaw = Number.parseInt(
    String(formData.get("fetch_interval_minutes") ?? "1440"),
    10,
  );

  if (!name || !baseUrl) return;

  const trustWeight = Number.isFinite(trustWeightRaw)
    ? Math.max(0, Math.min(100, trustWeightRaw))
    : 50;
  const fetchIntervalMinutes =
    Number.isFinite(fetchIntervalRaw) && fetchIntervalRaw > 0
      ? fetchIntervalRaw
      : 1440;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("content_sources").insert({
      name,
      kind,
      base_url: baseUrl,
      trust_weight: trustWeight,
      fetch_interval_minutes: fetchIntervalMinutes,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    if (error) return;
    revalidatePath("/admin/news-sources");
  } catch (e) {
    console.error("[upsertAdminNewsSource] failed", e);
  }
}

export async function setAdminNewsSourceActive(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const id = String(formData.get("id") ?? "").trim();
  const next = String(formData.get("is_active") ?? "").trim() === "true";
  if (!id) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("content_sources")
      .update({ is_active: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return;
    revalidatePath("/admin/news-sources");
  } catch (e) {
    console.error("[setAdminNewsSourceActive] failed", e);
  }
}

export async function fetchContentOpsAutomationHeartbeat(): Promise<
  { ok: true; heartbeat: AutomationHeartbeatResult } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const since = new Date(
      Date.now() - CONTENT_OPS_HEARTBEAT_LOOKBACK_HOURS * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await admin
      .from("content_runs")
      .select("trigger_type, created_at, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) return { ok: false, error: error.message };
    const rows = (data ?? []) as AutomationHeartbeatInputRow[];
    const heartbeat = computeAutomationHeartbeat(rows, Date.now(), {
      lookbackHours: CONTENT_OPS_HEARTBEAT_LOOKBACK_HOURS,
    });
    return { ok: true, heartbeat };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function listAdminContentRuns(): Promise<
  { ok: true; rows: AdminContentRunRow[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_runs")
      .select(
        "id, run_type, status, trigger_type, started_at, ended_at, error_summary, metadata, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: (data ?? []) as unknown as AdminContentRunRow[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function createManualContentRun(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const runType = String(formData.get("run_type") ?? "").trim() as ContentOpsRunType;
  if (!runType) return;
  await executeAdminRunType(runType);
}

async function executeAdminRunType(runType: ContentOpsRunType): Promise<void> {
  try {
    await executeContentOpsRun({
      runType,
      triggerType: "manual",
    });

    revalidatePath("/admin/runs");
    revalidatePath("/admin/content-queue");
    revalidatePath("/admin/subscribers");
    revalidatePath("/admin/news-sources");
  } catch (e) {
    console.error("[executeAdminRunType] failed", e);
  }
}

export async function runAdminContentOpsScenario(): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  try {
    await runContentOpsScenario({
      triggerType: "manual",
      sequence: CONTENT_OPS_RUN_SEQUENCE,
    });
  } catch (e) {
    console.error("[runAdminContentOpsScenario] failed", e);
  }
}

export async function runRetryFailedPublishOnly(): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;
  await executeAdminRunType("publish_retry_failed");
}

export async function listAdminNewsletterSubscribers(): Promise<
  | { ok: true; rows: AdminNewsletterSubscriberRow[] }
  | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select(
        "id, email, status, locale, frequency_pref, consent_at, unsubscribe_at, source, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      rows: (data ?? []) as unknown as AdminNewsletterSubscriberRow[],
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function addAdminNewsletterSubscriber(formData: FormData): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const frequencyPref =
    String(formData.get("frequency_pref") ?? "weekly").trim() || "weekly";

  if (!EMAIL_RE.test(emailRaw) || emailRaw.length > 254) {
    return;
  }

  try {
    const nowIso = new Date().toISOString();
    const admin = createAdminClient();
    const { error } = await admin.from("newsletter_subscribers").upsert(
      {
        email: emailRaw,
        status: "subscribed",
        locale,
        frequency_pref: frequencyPref,
        consent_at: nowIso,
        unsubscribe_at: null,
        source: "admin_manual",
        updated_at: nowIso,
      },
      { onConflict: "email_normalized" },
    );
    if (error) return;
    revalidatePath("/admin/subscribers");
  } catch (e) {
    console.error("[addAdminNewsletterSubscriber] failed", e);
  }
}

export async function updateAdminNewsletterSubscriberStatus(
  formData: FormData,
): Promise<void> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return;

  try {
    const nowIso = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status,
      updated_at: nowIso,
    };
    if (status === "unsubscribed") {
      patch.unsubscribe_at = nowIso;
    } else if (status === "subscribed") {
      patch.unsubscribe_at = null;
      patch.consent_at = nowIso;
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("newsletter_subscribers")
      .update(patch)
      .eq("id", id);
    if (error) return;
    revalidatePath("/admin/subscribers");
  } catch (e) {
    console.error("[updateAdminNewsletterSubscriberStatus] failed", e);
  }
}

export async function fetchMorningOpsFunnelScoreboard(): Promise<
  { ok: true; data: MorningOpsFunnelScoreboard } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const admin = createAdminClient();
    const data = await buildMorningOpsFunnelScoreboard(admin);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
