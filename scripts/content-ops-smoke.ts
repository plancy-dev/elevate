import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  runDraftGeneratePipeline,
  runIngestPipeline,
  runPublishPipeline,
} from "@/lib/content-ops/pipeline-runner";
import type { Json } from "@/types/database.types";

dotenv.config({ path: ".env.local" });

async function createRun(runType: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_runs")
    .insert({
      run_type: runType,
      status: "running",
      trigger_type: "manual",
      started_at: new Date().toISOString(),
      metadata: {
        smoke_fixture: true,
      },
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`failed to create run(${runType}): ${error?.message ?? "unknown"}`);
  }
  return data.id;
}

async function finishRun(params: {
  id: string;
  status: "succeeded" | "failed";
  metadata: Json;
  errorSummary: string | null;
}) {
  const admin = createAdminClient();
  await admin
    .from("content_runs")
    .update({
      status: params.status,
      ended_at: new Date().toISOString(),
      metadata: {
        smoke_fixture: true,
        result: params.metadata,
      },
      error_summary: params.errorSummary,
    })
    .eq("id", params.id);
}

async function seedScenarioFixtures() {
  const admin = createAdminClient();

  const sourceFixtures = [
    {
      name: "[SMOKE] HNRSS Frontpage",
      kind: "rss",
      base_url: "https://hnrss.org/frontpage",
      rss_url: "https://hnrss.org/frontpage",
      is_active: true,
      trust_weight: 75,
      fetch_interval_minutes: 60,
      updated_at: new Date().toISOString(),
    },
    {
      name: "[SMOKE] Broken RSS Fixture",
      kind: "rss",
      base_url: "https://example.invalid/rss",
      rss_url: "https://example.invalid/rss",
      is_active: true,
      trust_weight: 80,
      fetch_interval_minutes: 60,
      updated_at: new Date().toISOString(),
    },
  ] as const;

  for (const fixture of sourceFixtures) {
    const { data: existing } = await admin
      .from("content_sources")
      .select("id")
      .eq("base_url", fixture.base_url)
      .maybeSingle();

    if (existing?.id) {
      await admin.from("content_sources").update(fixture).eq("id", existing.id);
    } else {
      await admin.from("content_sources").insert(fixture);
    }
  }

  await admin.from("newsletter_subscribers").upsert(
    {
      email: "invalid-email",
      status: "subscribed",
      locale: "en",
      frequency_pref: "daily",
      source: "smoke_fixture",
      consent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email_normalized" },
  );

  await admin.from("content_items").insert({
    type: "blog",
    title: `Smoke Blog Publish ${new Date().toISOString().slice(0, 19)}`,
    locale: "ko",
    summary: "Smoke test item for locale template + CTA enforcement.",
    body_markdown: "이 문서는 스모크 테스트를 위한 본문입니다.",
    status: "approved",
    metadata: {
      smoke_fixture: true,
    },
  });
}

async function main() {
  await seedScenarioFixtures();

  const ingestRunId = await createRun("ingest");
  const ingest = await runIngestPipeline(ingestRunId);
  await finishRun({
    id: ingestRunId,
    status: "succeeded",
    metadata: ingest as unknown as Json,
    errorSummary:
      ingest.failureMessages.length > 0
        ? `warning:${ingest.failureMessages[0]}`
        : null,
  });

  const generateRunId = await createRun("draft_generate");
  const draft = await runDraftGeneratePipeline(generateRunId);
  await finishRun({
    id: generateRunId,
    status: "succeeded",
    metadata: draft as unknown as Json,
    errorSummary: null,
  });

  const admin = createAdminClient();
  await admin
    .from("content_items")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("type", "newsletter")
    .eq("status", "draft");

  const publishRunId = await createRun("publish");
  const publish = await runPublishPipeline();
  await finishRun({
    id: publishRunId,
    status: publish.failedCount > 0 ? "failed" : "succeeded",
    metadata: publish as unknown as Json,
    errorSummary:
      publish.failureMessages.length > 0
        ? `warning:${publish.failureMessages[0]}`
        : null,
  });

  console.log(
    JSON.stringify(
      {
        ingest,
        draft,
        publish,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[content-ops-smoke] failed:", error);
  process.exit(1);
});
