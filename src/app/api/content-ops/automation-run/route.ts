import { NextResponse } from "next/server";
import {
  CONTENT_OPS_RUN_SEQUENCE,
  CONTENT_OPS_RUNTIME,
  type ContentOpsRunType,
  resolveRuntimeMismatchRule,
} from "@/lib/content-ops/automation-config";
import { emitStructuredContentOpsAlert } from "@/lib/content-ops/alerting";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  executeContentOpsRun,
  runContentOpsScenario,
} from "@/lib/content-ops/run-orchestrator";

type AutomationRunRequest = {
  runType?: ContentOpsRunType;
  scenario?: "daily_generation" | "publish_window" | "retry_window" | "full_sequence";
  source?: "cursor" | "vercel-cron";
};

function isValidRunType(value: unknown): value is ContentOpsRunType {
  return (
    value === "ingest" ||
    value === "draft_generate" ||
    value === "review_gate" ||
    value === "publish" ||
    value === "publish_retry_failed"
  );
}

function resolveScenarioSequence(
  scenario: AutomationRunRequest["scenario"],
): readonly ContentOpsRunType[] {
  if (scenario === "daily_generation") {
    return ["ingest", "draft_generate", "review_gate"];
  }
  if (scenario === "publish_window") {
    return ["publish"];
  }
  if (scenario === "retry_window") {
    return ["publish_retry_failed"];
  }
  return CONTENT_OPS_RUN_SEQUENCE;
}

async function recordRuntimeMismatchAlert(params: {
  triggerType: "api" | "scheduled";
  source: "cursor" | "vercel-cron";
  runType?: ContentOpsRunType;
  scenario?: AutomationRunRequest["scenario"];
}) {
  const mismatch = resolveRuntimeMismatchRule(params.source);
  if (!mismatch.mismatched) return;
  const admin = createAdminClient();
  const alertPayload = {
    run_type: params.runType ?? "automation_runtime_guard",
    reason: mismatch.reason,
    next_action: mismatch.nextAction,
    operator_links: {
      runs: "/admin/runs",
      content_quality: "/admin/content-quality",
      morning_ops: "/admin/morning-ops",
    },
    triggeredAt: new Date().toISOString(),
    metadata: {
      source: params.source,
      runtime: CONTENT_OPS_RUNTIME,
      scenario: params.scenario ?? "single",
    },
  } as const;
  await admin.from("content_runs").insert({
    run_type: params.runType ?? "automation_runtime_guard",
    status: "failed",
    trigger_type: params.triggerType,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    error_summary: mismatch.reason,
    metadata: {
      automation_source: params.source,
      runtime: CONTENT_OPS_RUNTIME,
      scenario: params.scenario ?? "single",
      alert: alertPayload,
    },
  });
  await emitStructuredContentOpsAlert(alertPayload);
}

export async function POST(req: Request) {
  const automationToken = process.env.CONTENT_OPS_AUTOMATION_TOKEN?.trim();
  if (!automationToken) {
    return NextResponse.json(
      { ok: false, error: "automation_token_not_configured" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth !== `Bearer ${automationToken}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as AutomationRunRequest;
  const source = body.source ?? "cursor";
  const mismatch = resolveRuntimeMismatchRule(source);
  if (mismatch.mismatched) {
    await recordRuntimeMismatchAlert({
      triggerType: "api",
      source,
      runType: body.runType,
      scenario: body.scenario,
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: mismatch.reason,
      next_action: mismatch.nextAction,
    });
  }

  if (body.runType && !isValidRunType(body.runType)) {
    return NextResponse.json({ ok: false, error: "invalid_run_type" }, { status: 400 });
  }

  try {
    if (body.runType) {
      const result = await executeContentOpsRun({
        runType: body.runType,
        triggerType: "api",
        metadata: {
          automation_source: source,
          runtime: CONTENT_OPS_RUNTIME,
        },
      });
      return NextResponse.json({ ok: true, mode: "single", result });
    }

    const scenario = body.scenario ?? "full_sequence";
    const sequence = resolveScenarioSequence(scenario);
    await runContentOpsScenario({
      triggerType: "api",
      sequence,
      metadata: {
        automation_source: source,
        runtime: CONTENT_OPS_RUNTIME,
        scenario,
      },
    });
    return NextResponse.json({ ok: true, mode: "scenario", scenario, sequence });
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
  const runTypeRaw = url.searchParams.get("runType");
  const scenarioRaw = url.searchParams.get("scenario");
  const sourceRaw = url.searchParams.get("source");
  const source = sourceRaw === "vercel-cron" ? "vercel-cron" : "cursor";
  const cronHeader = req.headers.get("x-vercel-cron");
  const token = url.searchParams.get("token")?.trim() ?? "";
  const tokenAuthorized = automationToken ? token === automationToken : false;
  const isTrustedVercelCron = source === "vercel-cron" && Boolean(cronHeader);
  if (!tokenAuthorized && !isTrustedVercelCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const mismatch = resolveRuntimeMismatchRule(source);
  if (mismatch.mismatched) {
    await recordRuntimeMismatchAlert({
      triggerType: "scheduled",
      source,
      runType: isValidRunType(runTypeRaw) ? runTypeRaw : undefined,
      scenario:
        scenarioRaw === "daily_generation" ||
        scenarioRaw === "publish_window" ||
        scenarioRaw === "retry_window" ||
        scenarioRaw === "full_sequence"
          ? scenarioRaw
          : "full_sequence",
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: mismatch.reason,
      next_action: mismatch.nextAction,
    });
  }

  try {
    if (runTypeRaw) {
      if (!isValidRunType(runTypeRaw)) {
        return NextResponse.json({ ok: false, error: "invalid_run_type" }, { status: 400 });
      }
      const result = await executeContentOpsRun({
        runType: runTypeRaw,
        triggerType: "scheduled",
        metadata: {
          automation_source: source,
          runtime: CONTENT_OPS_RUNTIME,
        },
      });
      return NextResponse.json({ ok: true, mode: "single", result });
    }

    const scenario = (
      scenarioRaw === "daily_generation" ||
      scenarioRaw === "publish_window" ||
      scenarioRaw === "retry_window" ||
      scenarioRaw === "full_sequence"
        ? scenarioRaw
        : "full_sequence"
    ) as AutomationRunRequest["scenario"];
    const sequence = resolveScenarioSequence(scenario);
    await runContentOpsScenario({
      triggerType: "scheduled",
      sequence,
      metadata: {
        automation_source: source,
        runtime: CONTENT_OPS_RUNTIME,
        scenario,
      },
    });
    return NextResponse.json({ ok: true, mode: "scenario", scenario, sequence });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
