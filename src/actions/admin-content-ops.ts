"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";
import {
  CONTENT_OPS_RUN_SEQUENCE,
  type ContentOpsRunType,
} from "@/lib/content-ops/automation-config";
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

const CONTENT_OPS_HEARTBEAT_LOOKBACK_HOURS = 168;

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
